const PLATFORM_SHARE_HOSTS = [
  "v.douyin.com",
  "douyin.com",
  "iesdouyin.com",
  "kuaishou.com",
  "xhslink.com",
  "xiaohongshu.com",
  "weibo.com",
  "weibo.cn",
  "ixigua.com",
];

/** Returns true for platform share pages, which must be parsed before playback. */
export function isPlatformShareUrl(value: string): boolean {
  try {
    const hostname = new URL(value.trim()).hostname.toLowerCase().replace(/\.$/, "");
    return PLATFORM_SHARE_HOSTS.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}
