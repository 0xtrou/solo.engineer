import { z } from "zod";

export const cryptoRegionIds = ["launches", "layer1", "layer2", "defi", "markets"] as const;
export type CryptoRegionId = (typeof cryptoRegionIds)[number];

export const cryptoSourceTiers = [
  "T1 wire",
  "T2 trade",
  "T3 community",
] as const;
export type CryptoSourceTier = (typeof cryptoSourceTiers)[number];

export const cryptoCategoryIds = [
  "launches-and-tge",
  "layer-1",
  "layer-2",
  "defi",
  "markets",
] as const;
export type CryptoCategoryId = (typeof cryptoCategoryIds)[number];

export const cryptoCategoryLabels = [
  "Launches & TGE",
  "Layer 1",
  "Layer 2",
  "DeFi",
  "Markets",
] as const;
export type CryptoCategory = (typeof cryptoCategoryLabels)[number];

export const cryptoSourceIds = [
  "coindesk",
  "cointelegraph",
  "cointelegraph-markets",
  "bitcointalk-launches",
  "airdrops-io",
  "coingecko-trending",
  "solana",
  "sui",
  "sei",
  "blast",
  "coingecko-markets",
  "defillama-chains",
  "defillama-protocols",
  "bitcoin-magazine",
  "bitmex",
  "monero",
  "monero-observer",
  "cardano-iohk",
  "cardano-org",
  "celestia",
  "movement",
  "the-defiant",
  "blockworks",
  "decrypt",
  "cryptoslate",
  "dappradar",
  "matter-labs",
] as const;
export type CryptoSourceId = (typeof cryptoSourceIds)[number];

export const cryptoArticleSchema = z.object({
  id: z.string().min(1),
  region: z.enum(cryptoRegionIds),
  category: z.enum(cryptoCategoryLabels),
  sourceId: z.enum(cryptoSourceIds),
  sourceName: z.string().min(1),
  sourceHomepage: z.string().url(),
  title: z.string().min(1),
  url: z.string().url(),
  publishedAt: z.string().datetime().optional(),
  summary: z.string().optional(),
  tier: z.enum(cryptoSourceTiers).optional(),
  categoryScores: z.record(z.enum(cryptoCategoryLabels), z.number()).optional(),
});

export type CryptoArticle = z.infer<typeof cryptoArticleSchema>;

export const cryptoSourceStatusSchema = z.object({
  sourceId: z.enum(cryptoSourceIds),
  region: z.enum(cryptoRegionIds),
  category: z.enum(cryptoCategoryLabels),
  name: z.string().min(1),
  homepage: z.string().url(),
  endpoint: z.string().url(),
  loaded: z.boolean(),
  itemCount: z.number().int().nonnegative(),
  rawItemCount: z.number().int().nonnegative().optional(),
  message: z.string().optional(),
  tier: z.enum(cryptoSourceTiers).optional(),
});

export type CryptoSourceStatus = z.infer<typeof cryptoSourceStatusSchema>;

export const cryptoFeedResponseSchema = z.object({
  items: z.array(cryptoArticleSchema),
  statuses: z.array(cryptoSourceStatusSchema),
  fetchedAt: z.string().datetime(),
});

export type CryptoFeedResponse = z.infer<typeof cryptoFeedResponseSchema>;
