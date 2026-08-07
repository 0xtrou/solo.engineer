import { maxScore, scoreCategoriesKeyword } from "@/lib/categories";
import type { FeedItem } from "@/lib/types";

const professionalTerms = [
  "ai",
  "agent",
  "analytics",
  "artificial intelligence",
  "automation",
  "business",
  "chip",
  "cloud",
  "compliance",
  "computer",
  "conference",
  "cyber",
  "data",
  "developer",
  "digital",
  "economy",
  "education",
  "enterprise",
  "finance",
  "growth",
  "infrastructure",
  "investment",
  "knowledge",
  "learning",
  "llm",
  "machine learning",
  "model",
  "open access",
  "open source",
  "policy",
  "privacy",
  "product",
  "publishing",
  "regulation",
  "research",
  "risk",
  "robot",
  "saas",
  "scholarly",
  "science",
  "security",
  "semiconductor",
  "social media",
  "software",
  "startup",
  "technology",
  "trade",
  "vietnam",
  "wordpress",
];

const socialAdministrationTerms = [
  "administration",
  "civil service",
  "digital government",
  "e-government",
  "governance",
  "government",
  "public administration",
  "public policy",
  "public sector",
];

const lowSignalTerms = [
  "celebrity",
  "dating",
  "giveaway",
  "meme",
  "music video",
  "sports",
];

const alwaysRelevantSources = new Set<FeedItem["source"]>([
  "arxiv",
  "openalex",
  "hugging-face",
  "microsoft-research",
  "google-ai",
  "mit-sloan",
  "social-media-today",
  "github",
  "stack-overflow",
  "world-bank",
]);

const policySources = new Set<FeedItem["source"]>([
  "eu-regulation",
  "us-regulation",
  "vietnam-regulation",
]);

function searchableText(item: FeedItem): string {
  return `${item.title} ${item.summary} ${item.tag ?? ""}`.toLowerCase();
}

function containsProfessionalTopic(text: string): boolean {
  return [...professionalTerms, ...socialAdministrationTerms].some((term) => text.includes(term));
}

export function isRelevant(item: FeedItem): boolean {
  const text = searchableText(item);
  if (lowSignalTerms.some((term) => text.includes(term))) return false;
  if (alwaysRelevantSources.has(item.source)) return true;
  if (policySources.has(item.source)) return containsProfessionalTopic(text);
  return containsProfessionalTopic(text);
}

const tierRank: Record<"T1" | "T2" | "T3", number> = { T1: 0, T2: 1, T3: 2 };

function sourceTierRank(tier: FeedItem["tier"]): number {
  return tier ? tierRank[tier] : 3;
}

export function filterAndRank(items: FeedItem[]): FeedItem[] {
  return items
    .filter(isRelevant)
    .map((item) => (item.categoryScores ? item : { ...item, categoryScores: scoreCategoriesKeyword(searchableText(item)) }))
    .sort((left, right) => {
      const latest = Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
      if (latest !== 0) return latest;
      const score = maxScore(right.categoryScores ?? {}) - maxScore(left.categoryScores ?? {});
      if (score !== 0) return score;
      return sourceTierRank(left.tier) - sourceTierRank(right.tier);
    });
}
