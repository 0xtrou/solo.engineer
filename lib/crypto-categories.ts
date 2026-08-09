export const CRYPTO_CATEGORIES = [
  "Launches & TGE",
  "Layer 1",
  "Layer 2",
  "DeFi",
  "Markets",
] as const;

export type CryptoCategory = (typeof CRYPTO_CATEGORIES)[number];

type CategorySignals = {
  keywords: string[];
  evidence: RegExp[];
};

const categorySignals: Record<CryptoCategory, CategorySignals> = {
  "Launches & TGE": {
    keywords: ["launch", "airdrop", "token", "mainnet", "presale", "listing", "ICO", "IDO", "IEO", "fair launch", "genesis", "claim", "distribute", "TGE", "migration", "vesting", "unlock"],
    evidence: [
      /\b(?:TGE|token generation event|airdrop|mainnet\s+launch|presale|IDO|IEO|fair\s+launch|genesis\s+(?:block|sale))\b/i,
      /\b(?:claim|claiming|distribut(?:e|ed|ion))\s+(?:your|the|now|live|open)\b/i,
      /\b(?:list(?:ing|ed))\s+(?:on|at)\s+(?:Binance|Coinbase|Kraken|OKX|Bybit|Bitget|Upbit)\b/i,
      /\b(?:launch(?:es|ed|ing)?)\s+(?:on|at|mainnet|testnet|live)\b/i,
    ],
  },
  "Layer 1": {
    keywords: ["blockchain", "consensus", "Proof of Work", "Proof of Stake", "PoW", "PoS", "fork", "validator", "node", "block reward", "halving", "hashrate", " Nakamoto", "Bitcoin", "Ethereum", "Solana", "Sui", "Sei", "Cosmos", "Avalanche", "Cardano", "Polkadot", "Near", "Aptos", "Monero", "Litecoin", "Doge"],
    evidence: [
      /\b(?:block\s*(?:height|reward|time)|hashrate|difficulty\s+adjustment)\b/i,
      /\b(?:halving|halved)\b/i,
      /\b(?:validator|staking)\s+(?:set|count|rewards?|activation)\b/i,
      /\b(?:mainnet|testnet|fork)\s+(?:upgrade|v\d|hard\s*fork|activation)\b/i,
      /\b(?:Bitcoin|Ethereum|Solana|Sui|Sei|Cosmos|Avalanche|Cardano|Polkadot|Near|Aptos|Monad|Berachain)\b[^.]{0,40}\b(?:upgrade|fork|v\d|hard\s*fork|mainnet|staking|validator)/i,
    ],
  },
  "Layer 2": {
    keywords: ["rollup", "optimistic", "ZK", "zero-knowledge", "sequencer", "bridge", "batch", "Arbitrum", "Optimism", "Base", "zkSync", "Starknet", "Blast", "Scroll", "Linea", "Mantle", "Manta", "Polygon", "modular", "data availability", "op-stack", "L2", "L3"],
    evidence: [
      /\b(?:L2|L3|rollup|sequencer|batch\s+poster|data\s+availability)\b/i,
      /\b(?:Arbitrum|Optimism|Base|zkSync|Starknet|Blast|Scroll|Linea|Mantle|Manta|Polygon|Movement)\b[^.]{0,40}\b(?:upgrade|launch|deployment|mainnet|bridge|OP\s*Stack)/i,
      /\b(?:optimistic|zk|zero-?knowledge)\s+(?:rollup|proof|circuit)\b/i,
      /\b(?:bridge|tunnel|messenger)\s+(?:to|from|between)\b/i,
    ],
  },
  "DeFi": {
    keywords: ["DeFi", "TVL", "liquidity", "pool", "AMM", "lending", "borrow", "DEX", "yield", "staking", "Uniswap", "Aave", "Compound", "Curve", "MakerDAO", "Lido", "Rocket Pool", "perpetual", "swap", "impermanent loss", "oracle", "liquidation"],
    evidence: [
      /\bTVL\b/i,
      /\$\s?\d+(?:[.,]\d+)?\s*(?:billion|million|M|B|bn|m)\s*(?:TVL|total\s+value\s+locked|liquidity|deposits?|staked)\b/i,
      /\b(?:Uniswap|Aave|Compound|Curve|MakerDAO|Lido|Rocket\s*Pool|Pendle|EigenLayer)\b[^.]{0,40}\b(?:pool|vault|launch|deployment|upgrade|incentive)/i,
      /\b(?:yield|APR|APY)\s+(?:farming|farming|boost|reward|strategy)\b/i,
    ],
  },
  "Markets": {
    keywords: ["price", "volume", "market cap", "liquidation", "funding rate", "open interest", "pair", "rally", "dump", "pump", "support", "resistance", "ETF", "spot", "derivatives", "perpetuals", "bear", "bull"],
    evidence: [
      /\$\s?\d+(?:[.,]\d+)?\s*(?:billion|million|M|B|bn|m|trillion|T|k|K)\b/i,
      /\b\d+(?:[.,]\d+)?\s*%\s*(?:gain|drop|surge|plunge|rally|decline|up|down|change)\b/i,
      /\b(?:24h|7d|30d|YTD)\s*(?:volume|change|high|low|return)\b/i,
      /\b(?:ETF|spot|futures|perpetuals?|options?)\s+(?:approval|launch|inflow|outflow|filing|listing)\b/i,
      /\b(?:market\s+cap|fully\s+diluted|FDV|circulating\s+supply)\s+(?:of\s+)?\$?\d/i,
      /\b(?:liquidation|liquidated)\s+(?:of|event|cascade|long|short)\b/i,
    ],
  },
};

const emptyScores: Record<CryptoCategory, number> = {
  "Launches & TGE": 0,
  "Layer 1": 0,
  "Layer 2": 0,
  "DeFi": 0,
  "Markets": 0,
};

function keywordRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (/[\u3400-\u9fff\u3000-\u303f]/.test(term)) return new RegExp(escaped, "i");
  return new RegExp(`\\b${escaped}\\b`, "i");
}

const categoryKeywordRegexes: Record<CryptoCategory, RegExp[]> = Object.fromEntries(
  (Object.entries(categorySignals) as Array<[CryptoCategory, CategorySignals]>).map(([category, { keywords }]) => [
    category,
    keywords.map(keywordRegex),
  ]),
) as Record<CryptoCategory, RegExp[]>;

export function scoreCategories(text: string): Record<CryptoCategory, number> {
  const scores: Record<CryptoCategory, number> = { ...emptyScores };
  for (const category of CRYPTO_CATEGORIES) {
    const evidenceHits = categorySignals[category].evidence.reduce((count, regex) => count + (regex.test(text) ? 1 : 0), 0);
    const keywordHits = categoryKeywordRegexes[category].reduce((count, regex) => count + (regex.test(text) ? 1 : 0), 0);
    let score = evidenceHits * 3;
    if (evidenceHits > 0 || keywordHits >= 2) score += keywordHits;
    scores[category] = score;
  }
  return scores;
}

export function categorizeArticle(
  title: string,
  summary: string | undefined,
  fallback: CryptoCategory,
): { category: CryptoCategory; scores: Record<CryptoCategory, number> } {
  const scores = scoreCategories(`${title} ${summary ?? ""}`);
  let best = fallback;
  let bestScore = 0;
  for (const category of CRYPTO_CATEGORIES) {
    if (scores[category] > bestScore) {
      bestScore = scores[category];
      best = category;
    }
  }
  return { category: best, scores };
}

export function maxScore(scores: Partial<Record<CryptoCategory, number>> | undefined): number {
  if (!scores) return 0;
  let max = 0;
  for (const category of CRYPTO_CATEGORIES) {
    const value = scores[category];
    if (typeof value === "number" && value > max) max = value;
  }
  return max;
}

export const cryptoCategoryShortLabels: Record<CryptoCategory, string> = {
  "Launches & TGE": "LNC",
  "Layer 1": "L1",
  "Layer 2": "L2",
  "DeFi": "DEFI",
  "Markets": "MKT",
};
