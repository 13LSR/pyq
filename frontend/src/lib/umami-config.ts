/** Public website/share identifiers only. Never put an admin token or database secret here. */
export const umamiConfig = {
  enabled: process.env.NEXT_PUBLIC_UMAMI_ENABLED !== "false",
  url: (process.env.NEXT_PUBLIC_UMAMI_URL || "https://umami.331106.xyz").replace(/\/+$/, ""),
  websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "adab2b3b-abdc-4aa5-9357-55dab0f1524b",
  shareId: process.env.NEXT_PUBLIC_UMAMI_SHARE_ID || "uoHMtuhCjTf5ITC6",
  domains: (process.env.NEXT_PUBLIC_UMAMI_DOMAINS || "pyq.331106.xyz")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean),
};

export function canTrackUmamiPage(hostname: string, pathname: string): boolean {
  return umamiConfig.enabled &&
    umamiConfig.domains.includes(hostname.toLowerCase()) &&
    pathname !== "/admin" && !pathname.startsWith("/admin/");
}
