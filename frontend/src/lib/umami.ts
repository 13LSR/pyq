import { umamiConfig } from "./umami-config";

export interface UmamiStats {
  pageviews: number;
  visitors: number;
}

interface Share {
  websiteId: string;
  token: string;
}

class UmamiHttpError extends Error {
  constructor(readonly status: number) {
    super(`Umami HTTP ${status}`);
  }
}

/** Browser memory only: concurrent widgets share requests and expired tokens are retried once. */
export class UmamiClient {
  private share?: { promise: Promise<Share>; expiresAt: number };
  private stats = new Map<string, { promise: Promise<UmamiStats>; expiresAt: number }>();

  constructor(
    private config: Pick<typeof umamiConfig, "url" | "websiteId" | "shareId">,
    private fetcher: typeof fetch = fetch,
    private timeoutMs = 15_000,
  ) {}

  private async fetchJson(url: string, headers?: HeadersInit): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      // Native browser fetch must not receive this client instance as its receiver.
      const fetcher = this.fetcher;
      const response = await fetcher(url, {
        headers,
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new UmamiHttpError(response.status);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  private getShare(): Promise<Share> {
    if (!this.share || Date.now() >= this.share.expiresAt) {
      const promise = this.fetchJson(
        `${this.config.url}/api/share/${encodeURIComponent(this.config.shareId)}`,
      ).then((value) => {
        const data = value as Partial<Share> | null;
        if (data?.websiteId !== this.config.websiteId || typeof data.token !== "string" || !data.token) {
          throw new Error("Umami share does not match the configured website");
        }
        return data as Share;
      }).catch((error: unknown) => {
        if (this.share?.promise === promise) this.share = undefined;
        throw error;
      });
      this.share = { promise, expiresAt: Date.now() + 300_000 };
    }
    return this.share.promise;
  }

  private async requestStats(path?: string): Promise<UmamiStats> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const pendingShare = this.getShare();
      const share = await pendingShare;
      const params = new URLSearchParams({
        startAt: "0",
        endAt: String(Date.now()),
        timezone: "Asia/Shanghai",
      });
      if (path) params.set("path", `eq.${path}`);
      try {
        const value = await this.fetchJson(
          `${this.config.url}/api/websites/${share.websiteId}/stats?${params}`,
          { "x-umami-share-token": share.token },
        );
        const data = value as Partial<UmamiStats> | null;
        if (typeof data?.pageviews !== "number" || !Number.isFinite(data.pageviews) || data.pageviews < 0 ||
            typeof data.visitors !== "number" || !Number.isFinite(data.visitors) || data.visitors < 0) {
          throw new Error("Invalid Umami statistics response");
        }
        return { pageviews: data.pageviews, visitors: data.visitors };
      } catch (error) {
        if (!(error instanceof UmamiHttpError) || error.status !== 401 || attempt === 1) throw error;
        if (this.share?.promise === pendingShare) this.share = undefined;
      }
    }
    throw new Error("Umami statistics unavailable");
  }

  getStats(path?: string): Promise<UmamiStats> {
    const key = path || "";
    const cached = this.stats.get(key);
    if (cached && Date.now() < cached.expiresAt) return cached.promise;
    const promise = this.requestStats(path).catch((error: unknown) => {
      if (this.stats.get(key)?.promise === promise) this.stats.delete(key);
      throw error;
    });
    // Bound memory when the reader navigates through many articles.
    if (this.stats.size >= 64) this.stats.delete(this.stats.keys().next().value!);
    this.stats.set(key, { promise, expiresAt: Date.now() + 30_000 });
    return promise;
  }

  invalidateStats() {
    this.stats.clear();
  }

  async getArticlePageviews(id: string, shortId?: string): Promise<number> {
    const paths = [...new Set([id, shortId].filter((value): value is string => !!value))]
      .map((value) => `/articles/${encodeURIComponent(value)}`);
    const counts = await Promise.all(paths.map((path) => this.getStats(path)));
    return counts.reduce((total, data) => total + data.pageviews, 0);
  }
}

export const umamiClient = new UmamiClient(umamiConfig);
export const UMAMI_PAGEVIEW_EVENT = "umami:pageview";
