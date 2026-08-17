import type { Category } from "@/lib/categories";

export const SOURCE_IDS = [
  "arxiv",
  "hacker-news",
  "github",
  "stack-overflow",
  "dev",
  "indie-hackers",
  "eu-regulation",
  "us-regulation",
  "vietnam-regulation",
  "baochinhphu",
  "congbobanan",
  "world-bank",
  "openalex",
  "hugging-face",
  "microsoft-research",
  "google-ai",
  "mit-sloan",
  "social-media-today",
  "wikimedia",
  "creative-commons",
  "open-knowledge-foundation",
  "openstreetmap",
  "internet-archive",
  "learning-equality",
  "carpentries",
  "public-knowledge-project",
  "center-for-open-science",
  "numfocus",
  "open-source-ecology",
  "open-education-global",
  "oapen",
  "open-food-facts",
  "apereo",
  "posit",
  "moodle",
  "h5p",
  "canvas-lms",
  "overleaf",
  "pensoft",
  "frontiers",
  "automattic",
  "proton",
  "plausible",
  "matomo",
  "mastodon",
  "bluesky",
  "hashnode",
  "discord",
] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

export type SourceTier = "T1" | "T2" | "T3";

export type FeedItem = {
  id: string;
  source: SourceId;
  title: string;
  summary: string;
  author: string;
  authorHandle?: string;
  authorAvatar?: string;
  url: string;
  publishedAt: string;
  score?: number;
  comments?: number;
  tag?: string;
  tier?: SourceTier;
  categoryScores?: Record<Category, number>;
};

export type SourceStatus = {
  source: SourceId;
  loaded: boolean;
  message?: string;
};

export type FeedResponse = {
  items: FeedItem[];
  statuses: SourceStatus[];
  fetchedAt: string;
};
