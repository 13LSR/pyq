import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Run the TypeScript helpers with Node's test runner, without another runtime dependency.
async function moduleUrl(path, replaceImport) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  if (replaceImport) outputText = outputText.replace(/from ["']\.\/umami-config["']/, `from "${replaceImport}"`);
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}

const configModule = await moduleUrl("../src/lib/umami-config.ts");
const { canTrackUmamiPage } = await import(configModule);
const { UmamiClient } = await import(await moduleUrl("../src/lib/umami.ts", configModule));
const config = { url: "https://analytics.example.com", websiteId: "website-1", shareId: "share-1" };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });

test("only public pages on the production domain are tracked", () => {
  assert.equal(canTrackUmamiPage("pyq.331106.xyz", "/"), true);
  assert.equal(canTrackUmamiPage("pyq.331106.xyz", "/articles/abc"), true);
  for (const hostname of ["localhost", "127.0.0.1", "preview.vercel.app", "pyq.331106.xyz.evil.example"]) {
    assert.equal(canTrackUmamiPage(hostname, "/"), false);
  }
  for (const pathname of ["/admin", "/admin/login", "/admin/settings"]) {
    assert.equal(canTrackUmamiPage("pyq.331106.xyz", pathname), false);
  }
});

test("mobile and desktop widgets share requests and accept zero counts", async () => {
  const calls = [];
  const client = new UmamiClient(config, async function (url, options) {
    assert.equal(this, undefined, "native browser fetch must be called without a custom receiver");
    calls.push(url);
    assert.equal(options.credentials, "omit");
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    return String(url).includes("/api/share/")
      ? json({ websiteId: config.websiteId, token: "temporary" })
      : json({ pageviews: 0, visitors: 0 });
  });
  const results = await Promise.all([client.getStats(), client.getStats()]);
  assert.deepEqual(results, [{ pageviews: 0, visitors: 0 }, { pageviews: 0, visitors: 0 }]);
  await client.getStats();
  assert.equal(calls.length, 2);
  client.invalidateStats();
  await client.getStats();
  assert.equal(calls.length, 3, "a new pageview refreshes stats but reuses the share token");
});

test("article reads combine short ID and UUID paths without double counting the same path", async () => {
  const paths = [];
  const client = new UmamiClient(config, async (url) => {
    if (String(url).includes("/api/share/")) return json({ websiteId: config.websiteId, token: "temporary" });
    const params = new URL(url).searchParams;
    assert.equal(params.get("startAt"), "0");
    assert.equal(params.get("timezone"), "Asia/Shanghai");
    const path = params.get("path");
    paths.push(path);
    return json({ pageviews: path.endsWith("/short") ? 4 : 7, visitors: 2 });
  });
  assert.equal(await client.getArticlePageviews("uuid", "short"), 11);
  assert.deepEqual(paths.sort(), ["eq./articles/short", "eq./articles/uuid"]);
  assert.equal(await client.getArticlePageviews("uuid", "uuid"), 7);
  assert.equal(paths.length, 2);
});

test("concurrent 401 responses refresh the share token once and retry each query once", async () => {
  let shareCalls = 0;
  let statsCalls = 0;
  const client = new UmamiClient(config, async (url, options) => {
    if (String(url).includes("/api/share/")) {
      shareCalls++;
      return json({ websiteId: config.websiteId, token: `temporary-${shareCalls}` });
    }
    statsCalls++;
    return options.headers["x-umami-share-token"] === "temporary-1"
      ? json({}, 401)
      : json({ pageviews: 8, visitors: 3 });
  });
  await Promise.all([client.getStats(), client.getStats("/articles/short")]);
  assert.equal(shareCalls, 2);
  assert.equal(statsCalls, 4);
});

test("persistent authentication failure stops after one retry", async () => {
  let statsCalls = 0;
  const client = new UmamiClient(config, async (url) => {
    if (String(url).includes("/api/share/")) return json({ websiteId: config.websiteId, token: "temporary" });
    statsCalls++;
    return json({}, 401);
  });
  await assert.rejects(client.getStats(), /401/);
  assert.equal(statsCalls, 2);
});

test("mismatched website IDs never query another website's statistics", async () => {
  let calls = 0;
  const client = new UmamiClient(config, async () => {
    calls++;
    return json({ websiteId: "another-website", token: "temporary" });
  });
  await assert.rejects(client.getStats(), /does not match/);
  assert.equal(calls, 1);
});

test("server failures and malformed responses are not converted to zero or cached as success", async () => {
  let statsCalls = 0;
  const client = new UmamiClient(config, async (url) => {
    if (String(url).includes("/api/share/")) return json({ websiteId: config.websiteId, token: "temporary" });
    statsCalls++;
    if (statsCalls === 1) return json({}, 500);
    if (statsCalls === 2) return json({ pageviews: "8", visitors: 3 });
    return json({ pageviews: 8, visitors: 3 });
  });
  await assert.rejects(client.getStats(), /500/);
  await assert.rejects(client.getStats(), /Invalid/);
  assert.deepEqual(await client.getStats(), { pageviews: 8, visitors: 3 });
});

test("network requests abort on timeout", async () => {
  const client = new UmamiClient(config, (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("request timed out")), { once: true });
  }), 20);
  await assert.rejects(client.getStats(), /timed out/);
});
