import { z } from "zod";

export const terminalRegionIds = ["us", "vietnam", "china", "global"] as const;
export type TerminalRegionId = (typeof terminalRegionIds)[number];

export const terminalSourceTiers = [
  "T1 international",
  "T2 trade",
  "T3 state-media",
] as const;
export type TerminalSourceTier = (typeof terminalSourceTiers)[number];

export const terminalCategoryIds = [
  "power-and-grid",
  "policy-and-controls",
  "hardware-and-compute",
  "capital-and-costs",
  "technology-and-research",
] as const;
export type TerminalCategoryId = (typeof terminalCategoryIds)[number];

export const terminalCategoryLabels = [
  "Power & grid",
  "Policy & controls",
  "Hardware & compute",
  "Capital & costs",
  "Technology & research",
] as const;
export type TerminalCategory = (typeof terminalCategoryLabels)[number];

export const terminalSourceIds = [
  "eia",
  "federal-register-bis",
  "nist-chips",
  "federal-reserve",
  "vietnam-government",
  "vietnam-science-technology",
  "evn",
  "moit",
  "ndrc-notices",
  "nea",
  "miit",
  "scmp",
  "technode",
  "vnexpress",
  "vietnamplus",
  "vir",
  "vneconomy",
  "nikkei-asia",
  "bloomberg",
  "wsj",
  "ieee-spectrum",
  "data-center-dynamics",
] as const;
export type TerminalSourceId = (typeof terminalSourceIds)[number];

export const terminalArticleSchema = z.object({
  id: z.string().min(1),
  region: z.enum(terminalRegionIds),
  category: z.enum(terminalCategoryLabels),
  sourceId: z.enum(terminalSourceIds),
  sourceName: z.string().min(1),
  sourceHomepage: z.string().url(),
  title: z.string().min(1),
  url: z.string().url(),
  publishedAt: z.string().datetime().optional(),
  summary: z.string().optional(),
  tier: z.enum(terminalSourceTiers).optional(),
});

export type TerminalArticle = z.infer<typeof terminalArticleSchema>;

export const terminalSourceStatusSchema = z.object({
  sourceId: z.enum(terminalSourceIds),
  region: z.enum(terminalRegionIds),
  category: z.enum(terminalCategoryLabels),
  name: z.string().min(1),
  homepage: z.string().url(),
  endpoint: z.string().url(),
  loaded: z.boolean(),
  itemCount: z.number().int().nonnegative(),
  message: z.string().optional(),
  tier: z.enum(terminalSourceTiers).optional(),
});

export type TerminalSourceStatus = z.infer<typeof terminalSourceStatusSchema>;

export const terminalFeedResponseSchema = z.object({
  items: z.array(terminalArticleSchema),
  statuses: z.array(terminalSourceStatusSchema),
  fetchedAt: z.string().datetime(),
});

export type TerminalFeedResponse = z.infer<typeof terminalFeedResponseSchema>;
