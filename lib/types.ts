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
  "world-bank",
  "openalex",
  "hugging-face",
  "microsoft-research",
  "google-ai",
  "mit-sloan",
  "social-media-today",
  "mastodon",
  "bluesky",
  "hashnode",
  "discord",
] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

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
