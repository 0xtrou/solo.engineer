import type { FeedItem } from "@/lib/types";

const professionalTerms = [
  "ai",
  "agent",
  "artificial intelligence",
  "automation",
  "business",
  "chip",
  "cloud",
  "compliance",
  "computer",
  "cyber",
  "data",
  "developer",
  "digital",
  "economy",
  "enterprise",
  "finance",
  "growth",
  "infrastructure",
  "investment",
  "llm",
  "machine learning",
  "model",
  "open source",
  "policy",
  "privacy",
  "product",
  "regulation",
  "research",
  "risk",
  "robot",
  "saas",
  "science",
  "security",
  "semiconductor",
  "social media",
  "software",
  "startup",
  "technology",
  "trade",
  "vietnam",
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

export function filterAndRank(items: FeedItem[]): FeedItem[] {
  return items.filter(isRelevant).sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
}
