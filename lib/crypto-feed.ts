import { categorizeArticle, maxScore, type CryptoCategory } from "@/lib/crypto-categories";
import { unstable_cache } from "next/cache";

export { type CryptoCategory };

export const cryptoRegionIds = ["launches", "layer1", "layer2", "defi", "markets"] as const;
export type CryptoRegionId = (typeof cryptoRegionIds)[number];
export type CryptoSourceTier = "T1 wire" | "T2 trade" | "T3 community";

export type CryptoArticle = {
  id: string;
  region: CryptoRegionId;
  category: CryptoCategory;
  categoryScores?: Record<CryptoCategory, number>;
  sourceId: string;
  sourceName: string;
  sourceHomepage: string;
  title: string;
  url: string;
  publishedAt?: string;
  summary?: string;
  tier?: CryptoSourceTier;
};

export type CryptoSourceStatus = {
  sourceId: string;
  region: CryptoRegionId;
  category: CryptoCategory;
  name: string;
  homepage: string;
  endpoint: string;
  loaded: boolean;
  itemCount: number;
  rawItemCount?: number;
  message?: string;
  tier?: CryptoSourceTier;
};

export type CryptoFeedResponse = {
  items: CryptoArticle[];
  statuses: CryptoSourceStatus[];
  fetchedAt: string;
  prices?: CryptoPriceTile[];
};

export type CryptoPriceTile = {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  marketCap: number;
  image: string;
};

type SourceDefinition = Omit<CryptoSourceStatus, "loaded" | "itemCount" | "message" | "tier"> & { tier: CryptoSourceTier };
type RssEntry = { title: string; url: string; summary?: string; publishedAt?: string };

const REVALIDATE_SECONDS = 600;
const sourceRequestInit: RequestInit = {
  cache: "no-store",
  headers: { "User-Agent": "SignalDesk/1.0 (personal crypto research reader)" },
};

const sourceDefinitions = {
  coindesk: {
    sourceId: "coindesk",
    region: "markets",
    category: "Markets",
    tier: "T1 wire",
    name: "CoinDesk",
    homepage: "https://www.coindesk.com/",
    endpoint: "https://www.coindesk.com/arc/outboundfeeds/rss/",
  },
  cointelegraph: {
    sourceId: "cointelegraph",
    region: "markets",
    category: "Markets",
    tier: "T1 wire",
    name: "CoinTelegraph",
    homepage: "https://cointelegraph.com/",
    endpoint: "https://cointelegraph.com/rss",
  },
  cointelegraphMarkets: {
    sourceId: "cointelegraph-markets",
    region: "markets",
    category: "Markets",
    tier: "T1 wire",
    name: "CoinTelegraph Markets",
    homepage: "https://cointelegraph.com/markets",
    endpoint: "https://cointelegraph.com/rss/category/markets",
  },
  bitcointalkLaunches: {
    sourceId: "bitcointalk-launches",
    region: "launches",
    category: "Launches & TGE",
    tier: "T2 trade",
    name: "BitcoinTalk Launches",
    homepage: "https://bitcointalk.org/index.php?board=7.0",
    endpoint: "https://news.google.com/rss/search?q=site:bitcointalk.org+(launch+OR+announcement+OR+TGE+OR+airdrop+OR+mainnet)+when:7d&hl=en-US&gl=US&ceid=US:en",
  },
  airdropsIo: {
    sourceId: "airdrops-io",
    region: "launches",
    category: "Launches & TGE",
    tier: "T2 trade",
    name: "Airdrops.io",
    homepage: "https://airdrops.io/",
    endpoint: "https://airdrops.io/feed/",
  },
  coingeckoTrending: {
    sourceId: "coingecko-trending",
    region: "launches",
    category: "Launches & TGE",
    tier: "T2 trade",
    name: "CoinGecko Trending",
    homepage: "https://www.coingecko.com/en/highlights/trending-crypto",
    endpoint: "https://api.coingecko.com/api/v3/search/trending",
  },
  solana: {
    sourceId: "solana",
    region: "layer1",
    category: "Layer 1",
    tier: "T1 wire",
    name: "Solana",
    homepage: "https://solana.com/",
    endpoint: "https://solana.com/news/rss.xml",
  },
  sui: {
    sourceId: "sui",
    region: "layer1",
    category: "Layer 1",
    tier: "T1 wire",
    name: "Sui",
    homepage: "https://sui.io/",
    endpoint: "https://www.sui.io/blog/rss.xml",
  },
  sei: {
    sourceId: "sei",
    region: "layer1",
    category: "Layer 1",
    tier: "T1 wire",
    name: "Sei",
    homepage: "https://www.sei.io/",
    endpoint: "https://blog.sei.io/feed/",
  },
  blast: {
    sourceId: "blast",
    region: "layer2",
    category: "Layer 2",
    tier: "T1 wire",
    name: "Blast",
    homepage: "https://blast.io/",
    endpoint: "https://blog.blast.io/rss/",
  },
  coingeckoMarkets: {
    sourceId: "coingecko-markets",
    region: "markets",
    category: "Markets",
    tier: "T1 wire",
    name: "CoinGecko Markets",
    homepage: "https://www.coingecko.com/en",
    endpoint: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1",
  },
  defillamaChains: {
    sourceId: "defillama-chains",
    region: "defi",
    category: "DeFi",
    tier: "T1 wire",
    name: "DeFiLlama Chains",
    homepage: "https://defillama.com/chains",
    endpoint: "https://api.llama.fi/v2/chains",
  },
  defillamaProtocols: {
    sourceId: "defillama-protocols",
    region: "defi",
    category: "DeFi",
    tier: "T2 trade",
    name: "DeFiLlama Protocols",
    homepage: "https://defillama.com/protocols",
    endpoint: "https://api.llama.fi/protocols",
  },
  // PoW chains
  bitcoinMagazine: {
    sourceId: "bitcoin-magazine",
    region: "layer1",
    category: "Layer 1",
    tier: "T1 wire",
    name: "Bitcoin Magazine",
    homepage: "https://bitcoinmagazine.com/",
    endpoint: "https://bitcoinmagazine.com/feed",
  },
  bitmex: {
    sourceId: "bitmex",
    region: "markets",
    category: "Markets",
    tier: "T2 trade",
    name: "BitMEX Research",
    homepage: "https://blog.bitmex.com/",
    endpoint: "https://blog.bitmex.com/feed",
  },
  monero: {
    sourceId: "monero",
    region: "layer1",
    category: "Layer 1",
    tier: "T1 wire",
    name: "Monero",
    homepage: "https://getmonero.org/",
    endpoint: "https://getmonero.org/feed.xml",
  },
  moneroObserver: {
    sourceId: "monero-observer",
    region: "layer1",
    category: "Layer 1",
    tier: "T2 trade",
    name: "Monero Observer",
    homepage: "https://monero.observer/",
    endpoint: "https://monero.observer/feed.xml",
  },
  // PoS chains
  cardanoIohk: {
    sourceId: "cardano-iohk",
    region: "layer1",
    category: "Layer 1",
    tier: "T1 wire",
    name: "IOHK / Input Output",
    homepage: "https://iohk.io/",
    endpoint: "https://iohk.io/feed.xml",
  },
  cardanoOrg: {
    sourceId: "cardano-org",
    region: "layer1",
    category: "Layer 1",
    tier: "T1 wire",
    name: "Cardano",
    homepage: "https://cardano.org/",
    endpoint: "https://cardano.org/news/rss.xml",
  },
  celestia: {
    sourceId: "celestia",
    region: "layer2",
    category: "Layer 2",
    tier: "T1 wire",
    name: "Celestia",
    homepage: "https://celestia.org/",
    endpoint: "https://blog.celestia.org/feed",
  },
  movement: {
    sourceId: "movement",
    region: "layer2",
    category: "Layer 2",
    tier: "T1 wire",
    name: "Movement",
    homepage: "https://movementnetwork.xyz/",
    endpoint: "https://www.movementnetwork.xyz/blog/feed.xml",
  },
  // News / launch trackers
  theDefiant: {
    sourceId: "the-defiant",
    region: "markets",
    category: "Markets",
    tier: "T1 wire",
    name: "The Defiant",
    homepage: "https://thedefiant.io/",
    endpoint: "https://thedefiant.io/feed",
  },
  blockworks: {
    sourceId: "blockworks",
    region: "markets",
    category: "Markets",
    tier: "T1 wire",
    name: "Blockworks",
    homepage: "https://blockworks.co/",
    endpoint: "https://blockworks.co/feed",
  },
  decrypt: {
    sourceId: "decrypt",
    region: "markets",
    category: "Markets",
    tier: "T1 wire",
    name: "Decrypt",
    homepage: "https://decrypt.co/",
    endpoint: "https://decrypt.co/feed",
  },
  cryptoslate: {
    sourceId: "cryptoslate",
    region: "markets",
    category: "Markets",
    tier: "T2 trade",
    name: "CryptoSlate",
    homepage: "https://cryptoslate.com/",
    endpoint: "https://cryptoslate.com/feed/",
  },
  dappradar: {
    sourceId: "dappradar",
    region: "defi",
    category: "DeFi",
    tier: "T2 trade",
    name: "DappRadar",
    homepage: "https://dappradar.com/",
    endpoint: "https://dappradar.com/feed",
  },
  matterLabs: {
    sourceId: "matter-labs",
    region: "layer2",
    category: "Layer 2",
    tier: "T1 wire",
    name: "Matter Labs (zkSync)",
    homepage: "https://blog.matter-labs.io/",
    endpoint: "https://blog.matter-labs.io/feed",
  },
} as const satisfies Record<string, SourceDefinition>;

// Per-source relevance terms. Articles must match at least one term (title or title+summary).
const relevanceTerms: Partial<Record<string, string[]>> = {
  coindesk: ["bitcoin", "ethereum", "crypto", "token", "blockchain", "defi", "launch", "airdrop", "regulation", "sec", "wallet", "stablecoin", "layer", "rollup", "price", "etf", "mining", "validator", "staking"],
  cointelegraph: ["bitcoin", "ethereum", "crypto", "token", "blockchain", "defi", "launch", "airdrop", "regulation", "sec", "wallet", "stablecoin", "layer", "rollup", "price", "etf", "mining", "validator", "staking"],
  "cointelegraph-markets": ["price", "market", "rally", "dump", "pump", "gain", "drop", "surge", "plunge", "volume", "cap", "etf", "futures", "perpetual", "liquidation", "funding", "open interest", "bear", "bull", "resistance", "support"],
  "airdrops-io": ["airdrop", "token", "claim", "reward", "testnet", "mainnet", "retro", "incentive", "farming", "campaign", "distribute", "eligib"],
  solana: ["upgrade", "launch", "mainnet", "validator", "staking", "token", "delegation", "fork", "fee", "svm", "program", "runtime", "firedancer", "testnet"],
  sui: ["sui", "move", "upgrade", "launch", "mainnet", "token", "validator", "staking", "object", "package", "testnet"],
  sei: ["sei", "upgrade", "launch", "mainnet", "token", "validator", "staking", "parallel", "testnet", "v2", "dbcs"],
  blast: ["blast", "upgrade", "launch", "mainnet", "l2", "yield", "points", "deployment", "bridge", "eth", "testnet"],
};

const titleOnlyRelevanceSources = new Set(["airdrops-io", "bitcointalk-launches"]);

function stripHtml(value: string | undefined): string {
  return decodeEntities((value ?? "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeUrl(value: string | undefined, base: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(decodeEntities(value.trim()), base);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    if (url.protocol === "http:") url.protocol = "https:";
    return url.toString();
  } catch {
    return undefined;
  }
}

function xmlValue(xml: string, tag: string): string | undefined {
  return xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1];
}

function parseDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\//g, "-");
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
}

function getAttribute(value: string | undefined, attribute: string): string | undefined {
  return value?.match(new RegExp(`\\b${attribute}=["']([^"']+)["']`, "i"))?.[1];
}

function entryLink(item: string, base: string): string | undefined {
  const linkTags = [...item.matchAll(/<link\b([^>]*)>/gi)].map((match) => match[0]);
  const alternate = linkTags.find((tag) => /rel=["']alternate["']/i.test(tag));
  const atomHref = normalizeUrl(getAttribute(alternate ?? linkTags[0], "href"), base);
  if (atomHref) return atomHref;
  return normalizeUrl(stripHtml(xmlValue(item, "link")), base);
}

function parseRss(xml: string, base: string): RssEntry[] {
  const rssItems: RssEntry[] = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].flatMap((match) => {
    const item = match[1];
    const title = stripHtml(xmlValue(item, "title"));
    const url = entryLink(item, base);
    if (!title || !url) return [];
    return [{
      title,
      url,
      summary: stripHtml(xmlValue(item, "description") || xmlValue(item, "content:encoded")) || undefined,
      publishedAt: parseDate(stripHtml(xmlValue(item, "pubDate")) || stripHtml(xmlValue(item, "dc:date"))),
    }];
  });
  if (rssItems.length > 0) return rssItems;
  // Atom 1.0
  return [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)].flatMap((match) => {
    const entry = match[1];
    const title = stripHtml(xmlValue(entry, "title"));
    const url = entryLink(entry, base);
    if (!title || !url) return [];
    const summary = stripHtml(xmlValue(entry, "summary") || xmlValue(entry, "content")) || undefined;
    const publishedAt = parseDate(stripHtml(xmlValue(entry, "published")) || stripHtml(xmlValue(entry, "updated")));
    return [{ title, url, summary, publishedAt }];
  });
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { ...sourceRequestInit, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { ...sourceRequestInit, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

// CoinGecko trending — returns coins that are trending in last 24h.
type CoinGeckoTrendingResponse = { coins: Array<{ item: { id: string; name: string; symbol: string; market_cap_rank: number; slug: string; thumb: string; data?: { price?: number; price_btc?: string; price_change_percentage_24h?: { usd?: number } } } }> };

async function getCoinGeckoTrending(): Promise<RssEntry[]> {
  const result = await fetchJson<CoinGeckoTrendingResponse>("https://api.coingecko.com/api/v3/search/trending");
  return result.coins.flatMap(({ item }) => {
    if (!item.name) return [];
    const price = item.data?.price;
    const change = item.data?.price_change_percentage_24h?.usd;
    const priceStr = typeof price === "number" ? `$${price.toFixed(price < 1 ? 6 : 2)}` : "";
    const changeStr = typeof change === "number" ? ` (${change >= 0 ? "+" : ""}${change.toFixed(1)}%)` : "";
    return [{
      title: `Trending: ${item.name} (${item.symbol?.toUpperCase() ?? ""})${priceStr ? ` ${priceStr}${changeStr}` : ""}`,
      url: `https://www.coingecko.com/en/coins/${item.id}`,
      summary: `${item.name} is trending on CoinGecko. Rank #${item.market_cap_rank ?? "n/a"}.`,
      publishedAt: new Date().toISOString(),
    }];
  });
}

// CoinGecko top markets — top 20 coins by market cap. Returns price tiles + synthesized articles.
type CoinGeckoMarket = { id: string; symbol: string; name: string; image: string; current_price: number; market_cap: number; market_cap_rank: number; price_change_percentage_24h: number; total_volume: number };

export async function getCoinGeckoPriceTiles(): Promise<CryptoPriceTile[]> {
  const result = await fetchJson<CoinGeckoMarket[]>("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=12&page=1");
  return result.map((coin) => ({
    id: coin.id,
    symbol: coin.symbol?.toUpperCase() ?? coin.id,
    name: coin.name,
    priceUsd: coin.current_price ?? 0,
    change24h: coin.price_change_percentage_24h ?? 0,
    marketCap: coin.market_cap ?? 0,
    image: coin.image,
  }));
}

async function getCoinGeckoMarketsEntries(): Promise<RssEntry[]> {
  const result = await fetchJson<CoinGeckoMarket[]>("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1");
  return result.flatMap((coin) => {
    if (!coin.name) return [];
    const price = coin.current_price ?? 0;
    const change = coin.price_change_percentage_24h ?? 0;
    const cap = coin.market_cap ?? 0;
    const priceStr = `$${price.toFixed(price < 1 ? 6 : 2)}`;
    const changeStr = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
    const capStr = cap >= 1e9 ? `$${(cap / 1e9).toFixed(1)}B` : cap >= 1e6 ? `$${(cap / 1e6).toFixed(0)}M` : "";
    return [{
      title: `${coin.name} (${coin.symbol?.toUpperCase() ?? ""}): ${priceStr} (${changeStr} 24h)${capStr ? ` · ${capStr} cap` : ""}`,
      url: `https://www.coingecko.com/en/coins/${coin.id}`,
      summary: `${coin.name} price ${priceStr}, ${changeStr} change in 24h. Market cap ${capStr}. Volume $${(coin.total_volume ?? 0).toLocaleString()}.`,
      publishedAt: new Date().toISOString(),
    }];
  });
}

// DeFiLlama chains — TVL per chain.
type DefiLlamaChain = { name: string; chain: string; tvl: number; tokenSymbol: string };

async function getDefiLlamaChainsEntries(): Promise<RssEntry[]> {
  const result = await fetchJson<DefiLlamaChain[]>("https://api.llama.fi/v2/chains");
  return result
    .filter((c) => c.tvl > 0)
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, 15)
    .flatMap((chain) => {
      if (!chain.name) return [];
      const tvlStr = chain.tvl >= 1e9 ? `$${(chain.tvl / 1e9).toFixed(2)}B` : `$${(chain.tvl / 1e6).toFixed(0)}M`;
      return [{
        title: `${chain.name}: ${tvlStr} TVL${chain.tokenSymbol ? ` (${chain.tokenSymbol})` : ""}`,
        url: `https://defillama.com/chain/${chain.chain ?? chain.name.toLowerCase()}`,
        summary: `${chain.name} total value locked ${tvlStr}.`,
        publishedAt: new Date().toISOString(),
      }];
    });
}

// DeFiLlama protocols — top by TVL.
type DefiLlamaProtocol = { name: string; tvl: number; chain: string; category: string; symbol: string };

async function getDefiLlamaProtocolsEntries(): Promise<RssEntry[]> {
  const result = await fetchJson<DefiLlamaProtocol[]>("https://api.llama.fi/protocols");
  return result
    .filter((p) => p.tvl > 0)
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, 15)
    .flatMap((protocol) => {
      if (!protocol.name) return [];
      const tvlStr = protocol.tvl >= 1e9 ? `$${(protocol.tvl / 1e9).toFixed(2)}B` : `$${(protocol.tvl / 1e6).toFixed(0)}M`;
      return [{
        title: `${protocol.name}: ${tvlStr} TVL${protocol.category ? ` · ${protocol.category}` : ""}`,
        url: `https://defillama.com/protocol/${protocol.name.toLowerCase().replace(/\s+/g, "-")}`,
        summary: `${protocol.name} (${protocol.chain}) holds ${tvlStr} TVL. Category: ${protocol.category}.`,
        publishedAt: new Date().toISOString(),
      }];
    });
}

type Adapter = { source: SourceDefinition; load: () => Promise<RssEntry[]> };

const adapters: Adapter[] = [
  { source: sourceDefinitions.coindesk, load: async () => parseRss(await fetchText(sourceDefinitions.coindesk.endpoint), sourceDefinitions.coindesk.homepage) },
  { source: sourceDefinitions.cointelegraph, load: async () => parseRss(await fetchText(sourceDefinitions.cointelegraph.endpoint), sourceDefinitions.cointelegraph.homepage) },
  { source: sourceDefinitions.cointelegraphMarkets, load: async () => parseRss(await fetchText(sourceDefinitions.cointelegraphMarkets.endpoint), sourceDefinitions.cointelegraphMarkets.homepage) },
  { source: sourceDefinitions.bitcointalkLaunches, load: async () => parseRss(await fetchText(sourceDefinitions.bitcointalkLaunches.endpoint), sourceDefinitions.bitcointalkLaunches.homepage) },
  { source: sourceDefinitions.airdropsIo, load: async () => parseRss(await fetchText(sourceDefinitions.airdropsIo.endpoint), sourceDefinitions.airdropsIo.homepage) },
  { source: sourceDefinitions.coingeckoTrending, load: getCoinGeckoTrending },
  { source: sourceDefinitions.solana, load: async () => parseRss(await fetchText(sourceDefinitions.solana.endpoint), sourceDefinitions.solana.homepage) },
  { source: sourceDefinitions.sui, load: async () => parseRss(await fetchText(sourceDefinitions.sui.endpoint), sourceDefinitions.sui.homepage) },
  { source: sourceDefinitions.sei, load: async () => parseRss(await fetchText(sourceDefinitions.sei.endpoint), sourceDefinitions.sei.homepage) },
  { source: sourceDefinitions.blast, load: async () => parseRss(await fetchText(sourceDefinitions.blast.endpoint), sourceDefinitions.blast.homepage) },
  { source: sourceDefinitions.coingeckoMarkets, load: getCoinGeckoMarketsEntries },
  { source: sourceDefinitions.defillamaChains, load: getDefiLlamaChainsEntries },
  { source: sourceDefinitions.defillamaProtocols, load: getDefiLlamaProtocolsEntries },
  { source: sourceDefinitions.bitcoinMagazine, load: async () => parseRss(await fetchText(sourceDefinitions.bitcoinMagazine.endpoint), sourceDefinitions.bitcoinMagazine.homepage) },
  { source: sourceDefinitions.bitmex, load: async () => parseRss(await fetchText(sourceDefinitions.bitmex.endpoint), sourceDefinitions.bitmex.homepage) },
  { source: sourceDefinitions.monero, load: async () => parseRss(await fetchText(sourceDefinitions.monero.endpoint), sourceDefinitions.monero.homepage) },
  { source: sourceDefinitions.moneroObserver, load: async () => parseRss(await fetchText(sourceDefinitions.moneroObserver.endpoint), sourceDefinitions.moneroObserver.homepage) },
  { source: sourceDefinitions.cardanoIohk, load: async () => parseRss(await fetchText(sourceDefinitions.cardanoIohk.endpoint), sourceDefinitions.cardanoIohk.homepage) },
  { source: sourceDefinitions.cardanoOrg, load: async () => parseRss(await fetchText(sourceDefinitions.cardanoOrg.endpoint), sourceDefinitions.cardanoOrg.homepage) },
  { source: sourceDefinitions.celestia, load: async () => parseRss(await fetchText(sourceDefinitions.celestia.endpoint), sourceDefinitions.celestia.homepage) },
  { source: sourceDefinitions.movement, load: async () => parseRss(await fetchText(sourceDefinitions.movement.endpoint), sourceDefinitions.movement.homepage) },
  { source: sourceDefinitions.theDefiant, load: async () => parseRss(await fetchText(sourceDefinitions.theDefiant.endpoint), sourceDefinitions.theDefiant.homepage) },
  { source: sourceDefinitions.blockworks, load: async () => parseRss(await fetchText(sourceDefinitions.blockworks.endpoint), sourceDefinitions.blockworks.homepage) },
  { source: sourceDefinitions.decrypt, load: async () => parseRss(await fetchText(sourceDefinitions.decrypt.endpoint), sourceDefinitions.decrypt.homepage) },
  { source: sourceDefinitions.cryptoslate, load: async () => parseRss(await fetchText(sourceDefinitions.cryptoslate.endpoint), sourceDefinitions.cryptoslate.homepage) },
  { source: sourceDefinitions.dappradar, load: async () => parseRss(await fetchText(sourceDefinitions.dappradar.endpoint), sourceDefinitions.dappradar.homepage) },
  { source: sourceDefinitions.matterLabs, load: async () => parseRss(await fetchText(sourceDefinitions.matterLabs.endpoint), sourceDefinitions.matterLabs.homepage) },
];

export function isCryptoRegion(value: string | null | undefined): value is CryptoRegionId {
  return typeof value === "string" && cryptoRegionIds.includes(value as CryptoRegionId);
}

function toArticles(source: SourceDefinition, entries: RssEntry[], limit = 6): { items: CryptoArticle[]; rawCount: number } {
  const seen = new Set<string>();
  const terms = relevanceTerms[source.sourceId];
  const relevant = entries.filter((entry) => {
    if (!terms) return true;
    const text = `${entry.title}${titleOnlyRelevanceSources.has(source.sourceId) ? "" : ` ${entry.summary ?? ""}`}`.toLowerCase();
    return terms.some((term) => text.includes(term.toLowerCase()));
  });
  const items = relevant.flatMap((entry) => {
    const identity = `${entry.title}:${entry.url}`;
    if (seen.has(identity)) return [];
    seen.add(identity);
    const { category, scores } = categorizeArticle(entry.title, entry.summary, source.category);
    if (maxScore(scores) === 0) return [];
    return [{
      id: `${source.sourceId}:${entry.url}`,
      region: source.region,
      category,
      categoryScores: scores,
      sourceId: source.sourceId,
      sourceName: source.name,
      sourceHomepage: source.homepage,
      title: entry.title,
      url: entry.url,
      publishedAt: entry.publishedAt,
      summary: entry.summary,
      tier: source.tier,
    }];
  }).slice(0, limit);
  return { items, rawCount: relevant.length };
}

async function settleWithConcurrency<T>(tasks: Array<() => Promise<T>>, concurrency = 5): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < tasks.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await tasks[index]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  return results;
}

function cryptoTierRank(tier: CryptoSourceTier | undefined): number {
  switch (tier) {
    case "T1 wire":
      return 0;
    case "T2 trade":
      return 1;
    case "T3 community":
      return 2;
    default:
      return 3;
  }
}

export function getCryptoSourceStatuses(): CryptoSourceStatus[] {
  return Object.values(sourceDefinitions).map((source) => ({
    ...source,
    loaded: false,
    itemCount: 0,
    message: "Loading source status",
  }));
}

async function getCryptoFeedUncached(): Promise<CryptoFeedResponse> {
  const [results, prices] = await Promise.all([
    settleWithConcurrency(adapters.map(({ source, load }) => async () => {
      try {
        const { items, rawCount } = toArticles(source, await load(), 6);
        return {
          items,
          status: {
            ...source,
            loaded: true,
            itemCount: items.length,
            rawItemCount: rawCount,
            message: items.length === 0 ? "No current matched records" : undefined,
          } satisfies CryptoSourceStatus,
        };
      } catch (error) {
        return {
          items: [] as CryptoArticle[],
          status: {
            ...source,
            loaded: false,
            itemCount: 0,
            message: error instanceof Error ? error.message : "Source unavailable",
          } satisfies CryptoSourceStatus,
        };
      }
    }), 5),
    getCoinGeckoPriceTiles().catch(() => [] as CryptoPriceTile[]),
  ]);

  return {
    items: results.flatMap((result) => result.items).sort((left, right) => {
      const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;
      const latest = rightTime - leftTime;
      if (latest !== 0) return latest;
      const score = maxScore(right.categoryScores ?? {}) - maxScore(left.categoryScores ?? {});
      if (score !== 0) return score;
      return cryptoTierRank(left.tier) - cryptoTierRank(right.tier);
    }),
    statuses: results.map((result) => result.status),
    prices,
    fetchedAt: new Date().toISOString(),
  };
}

export const getCryptoFeed = unstable_cache(getCryptoFeedUncached, ["crypto-feed"], {
  revalidate: REVALIDATE_SECONDS,
});
