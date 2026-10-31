import { col, fn, where as sequelizeWhere } from "sequelize";

export const MAX_POST_TAGS = 10;
export const MAX_POST_TAG_LENGTH = 40;

export function normalizePostTags(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error("标签必须是数组");

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") throw new Error("标签格式无效");
    const tag = raw.trim().replace(/\s+/g, " ");
    if (!tag) continue;
    if (tag.length > MAX_POST_TAG_LENGTH) {
      throw new Error(`单个标签不能超过 ${MAX_POST_TAG_LENGTH} 个字符`);
    }
    const key = tag.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  if (tags.length > MAX_POST_TAGS) {
    throw new Error(`最多添加 ${MAX_POST_TAGS} 个标签`);
  }
  return tags;
}

export function readStoredPostTags(value: unknown): string[] {
  if (typeof value === "string") {
    try {
      return normalizePostTags(JSON.parse(value));
    } catch {
      return [];
    }
  }
  try {
    return normalizePostTags(value);
  } catch {
    return [];
  }
}

/** Exact tag match for MySQL and TiDB JSON columns. */
export function postTagWhere(tag: string) {
  return sequelizeWhere(fn("JSON_CONTAINS", col("tags"), JSON.stringify(tag)), 1);
}
