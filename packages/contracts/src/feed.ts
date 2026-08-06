import { z } from "zod";

export const feedSourceIds = [
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
  "osgeo",
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

export type FeedSourceId = (typeof feedSourceIds)[number];

export const feedCategoryLabels = [
  "Power & grid",
  "Policy & controls",
  "Hardware & compute",
  "Capital & costs",
  "Technology & research",
] as const;

export const feedItemSchema = z.object({
  id: z.string().min(1),
  source: z.enum(feedSourceIds),
  title: z.string().min(1),
  summary: z.string(),
  author: z.string().min(1),
  authorHandle: z.string().optional(),
  authorAvatar: z.string().url().optional(),
  url: z.string().url(),
  publishedAt: z.string().datetime(),
  score: z.number().int().optional(),
  comments: z.number().int().optional(),
  tag: z.string().optional(),
  tier: z.enum(["T1", "T2", "T3"]).optional(),
  categoryScores: z.record(z.enum(feedCategoryLabels), z.number()).optional(),
});

export type FeedItem = z.infer<typeof feedItemSchema>;

export const sourceStatusSchema = z.object({
  source: z.enum(feedSourceIds),
  loaded: z.boolean(),
  message: z.string().optional(),
});

export type SourceStatus = z.infer<typeof sourceStatusSchema>;

export const feedResponseSchema = z.object({
  items: z.array(feedItemSchema),
  statuses: z.array(sourceStatusSchema),
  fetchedAt: z.string().datetime(),
});

export type FeedResponse = z.infer<typeof feedResponseSchema>;
