import type { FeedItem } from "@/lib/types";

const topicAliases: Record<string, readonly string[]> = {
  "ai research": ["ai", "artificial intelligence", "machine learning", "model", "research"],
  "sota technology": ["technology", "software", "engineering", "infrastructure", "developer"],
  "business growth": ["business", "growth", "startup", "enterprise", "investment"],
  "global compliance": ["compliance", "governance", "regulation", "policy", "risk"],
  "vietnam regulation": ["vietnam", "law", "regulation", "policy", "digital government"],
  "us technology policy": ["us", "federal", "technology", "regulation", "policy"],
  "social administration": ["social media", "administration", "governance", "public administration", "public sector", "government", "moderation"],
};

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function searchableText(item: FeedItem): string {
  return normalize(`${item.title} ${item.summary} ${item.author} ${item.tag ?? ""}`);
}

export function matchesFeedSearch(item: FeedItem, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  const text = searchableText(item);
  if (text.includes(normalizedQuery)) return true;

  const aliases = topicAliases[normalizedQuery];
  if (aliases) return aliases.some((alias) => text.includes(alias));

  return normalizedQuery.split(" ").every((term) => text.includes(term));
}
