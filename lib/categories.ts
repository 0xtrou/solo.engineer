export const SHARED_CATEGORIES = [
  "Power & grid",
  "Policy & controls",
  "Hardware & compute",
  "Capital & costs",
  "Technology & research",
] as const;

export type Category = (typeof SHARED_CATEGORIES)[number];

// Evidence signals — each category requires PROOF, not just keyword presence.
// Evidence regex = 3 pts (anchored to specific shapes: figures, units, docket numbers).
// Keyword match = 1 pt (word-boundary only to avoid "ai" in "rain" false positives).
// An item only scores in a category if it has at least one evidence signal OR ≥2 keyword hits.

type CategorySignals = {
  keywords: string[];
  evidence: RegExp[];
};

const categorySignals: Record<Category, CategorySignals> = {
  "Power & grid": {
    keywords: ["power", "electricity", "grid", "energy", "generation", "transmission", "battery", "storage", "renewable", "nuclear", "solar", "wind", "turbine", "substation", "transformer", "lng", "natural gas", "load", "数据", "电力", "能源", "电网", "储能", "风电", "光伏", "核电", "điện", "điện lực", "lưới điện", "năng lượng"],
    evidence: [
      /\b\d+(?:[.,]\d+)?\s*(?:MW|GW|kW|MWh|GWh|kV|kVA|TWh|GWh)\b/i,
      /\b(?:plant|reactor|dam|turbine|substation|interconnect|pipeline|terminal|farm|park|station)\b[^.]{0,60}\b(?:commission|operational|online|complete|build|construct|deploy|launch)/i,
      /\b(?:ERCOT|PJM|MISO|CAISO|ISO-NE|SPP|NYISO|ENTSO-E|SGCC|EVN|State Grid)\b/,
      /\b(?:capacity|output|generation|demand|load)\s+(?:of\s+)?\d/i,
    ],
  },
  "Policy & controls": {
    keywords: ["policy", "regulation", "rule", "ban", "sanction", "tariff", "compliance", "directive", "order", "cybersecurity", "privacy", "antitrust", "approval", "enforcement", "decree", "监管", "管制", "出口", "禁令", "反垄断", "chính sách", "quy định", "cấm"],
    evidence: [
      /\b(?:Federal Register|docket|RIN\s?\d|public law|P\.?L\.?\s?\d|vol\.\s?\d|USC\s?\d|CFR\s?\d|EEA|AI Act|executive order)\b/i,
      /\b(?:effective|comply|compliance|enforce|enforcement|prohibit|prohibition|sanction|restriction|moratorium)\s+(?:date|by|on|from|starting|beginning)/i,
      /\b(?:EPA|FCC|FTC|DOE|DOD|DOC|BIS|SEC|CFTC|CAC|MIIT|MOFCOM|NDRC|NEA|MIC|MOF|MOJ|EC|DG|OFAC|USTR)\b/,
      /\b(?:ban(?:ned)?|sanction(?:ed)?|restrict(?:ed|ion)?|embargo|moratorium|approval|clearance|license|permit)\s+(?:on|of|from|against|to|for)\b/i,
    ],
  },
  "Hardware & compute": {
    keywords: ["chip", "semiconductor", "foundry", "wafer", "transistor", "memory", "photonics", "interconnect", "芯片", "半导体", "集成电路", "算力", "bán dẫn", "vi mạch"],
    evidence: [
      /\b\d+\s*nm\b/i,
      /\b(?:TSMC|Samsung|SMIC|Intel|GlobalFoundries|UMC|Tower)\b[^.]{0,40}\b(?:N\d|process|node|fab|foundry|wafer)/i,
      /\b(?:GPU|CPU|TPU|ASIC|FPGA|HBM\d?|DDR5|LPDDR)\b/i,
      /\b(?:ASML|Applied Materials|Lam Research|Tokyo Electron|AMEC|SMEE)\b/,
      /\b(?:wafer|fab|foundry|node|process|lithography|EUV|DUV)\s+(?:\d|capacity|ramp|build|production|manufactur)/i,
      /\b(?:NVIDIA|AMD|Intel|Apple|Qualcomm|Huawei|Hygon)\b[^.]{0,40}\b(?:H\d|MI\d|Xeon|Ryzen|EPYC|Ascend|A\d)/i,
    ],
  },
  "Capital & costs": {
    keywords: ["funding", "investment", "valuation", "venture", "capex", "deal", "cost", "price", "fdi", "factory", "投资", "融资", "亿元", "đầu tư", "vốn"],
    evidence: [
      /\$\s?\d+(?:[.,]\d+)?\s*(?:billion|million|M|B|bn|m|trillion|T)\b/i,
      /\b\d+(?:[.,]\d+)?\s*(?:billion|million|trillion)\s*(?:USD|EUR|CNY|RMB|JPY|VND|₫|yuan|renminbi)\b/i,
      /\b(?:元|万亿|千亿|百亿)\b/,
      /\b(?:raises?|raised|secures?|secured|lands?|lands|snags?|banks?|closed|closes)\s+\$?\d/i,
      /\b(?:Series\s+[A-Z]|pre-?[A-Z]|seed|angel|IPO|SPAC)\b/i,
      /\b(?:valuation|valued at|cap(?:italization)?|capex|opex)\s+(?:of\s+)?\$?\d/i,
      /\b(?:acquir(?:e|ed|es|ing)|merger|buyout|takeover|stake|equity)\s+(?:for|at|of)\s+\$?\d/i,
    ],
  },
  "Technology & research": {
    keywords: ["algorithm", "research", "breakthrough", "robotics", "platform", "deployment", "benchmark", "dataset", "人工智能", "模型", "研发", "深度求索", "trí tuệ nhân tạo", "chuyển đổi số", "công nghệ"],
    evidence: [
      /\b(?:GPT-?\d|LLaMA-?\d?|Llama-?\d?|Claude-?\d?|Gemini|DeepSeek|Qwen|Mistral|PaLM|BERT|Chinchilla|Falcon)\b/i,
      /\b(?:MMLU|HumanEval|GPQA|SWE-bench|ImageNet|COCO|GLUE|SuperGLUE|BIG-bench|GSM8K|MATH|MMLU-Pro|AIME)\b/i,
      /\b(?:arXiv|arxiv\.org|doi\.org|doi:\s?\d|preprint|Nature\s|Science\s|NeurIPS|ICML|ICLR|CVPR)\b/i,
      /\b(?:parameters|params|tokens|training data)\s*[:.]?\s*\d/i,
      /\b(?:benchmark|evaluation|ablation|fine-?tun(?:e|ed|ing)|pretrain(?:ed|ing)?|RLHF|SFT)\b[^.]{0,40}\b(?:score|result|accuracy|F1|BLEU|pass|rate)/i,
    ],
  },
};

const emptyScores: Record<Category, number> = {
  "Power & grid": 0,
  "Policy & controls": 0,
  "Hardware & compute": 0,
  "Capital & costs": 0,
  "Technology & research": 0,
};

// Word-boundary escape for keyword matching — avoids "ai" matching "rain".
function keywordRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // CJK characters don't use word boundaries; match directly.
  if (/[\u3400-\u9fff\u3000-\u303f]/.test(term)) return new RegExp(escaped, "i");
  return new RegExp(`\\b${escaped}\\b`, "i");
}

// Precompile keyword regexes once.
const categoryKeywordRegexes: Record<Category, RegExp[]> = Object.fromEntries(
  (Object.entries(categorySignals) as Array<[Category, CategorySignals]>).map(([category, { keywords }]) => [
    category,
    keywords.map(keywordRegex),
  ]),
) as Record<Category, RegExp[]>;

export function scoreCategories(text: string): Record<Category, number> {
  const scores: Record<Category, number> = { ...emptyScores };
  for (const category of SHARED_CATEGORIES) {
    const evidenceHits = categorySignals[category].evidence.reduce((count, regex) => count + (regex.test(text) ? 1 : 0), 0);
    const keywordHits = categoryKeywordRegexes[category].reduce((count, regex) => count + (regex.test(text) ? 1 : 0), 0);
    // Honest scoring: evidence signals dominate. Keyword-only counts only if ≥2 distinct hits.
    // No evidence + 1 stray keyword = 0 (no proof).
    let score = evidenceHits * 3;
    if (evidenceHits > 0 || keywordHits >= 2) score += keywordHits;
    scores[category] = score;
  }
  return scores;
}

// Keyword-only scoring for general-reader feeds (home). Word-boundary matching
// avoids false positives ("ai" in "rain") but doesn't require infra evidence.
// Suitable for blogs, research, policy, education content where $/MW/nm
// signals don't apply.
export function scoreCategoriesKeyword(text: string): Record<Category, number> {
  const scores: Record<Category, number> = { ...emptyScores };
  for (const category of SHARED_CATEGORIES) {
    scores[category] = categoryKeywordRegexes[category].reduce((count, regex) => count + (regex.test(text) ? 1 : 0), 0);
  }
  return scores;
}

export function categorizeArticle(
  title: string,
  summary: string | undefined,
  fallback: Category,
): { category: Category; scores: Record<Category, number> } {
  const scores = scoreCategories(`${title} ${summary ?? ""}`);
  let best = fallback;
  let bestScore = 0;
  for (const category of SHARED_CATEGORIES) {
    if (scores[category] > bestScore) {
      bestScore = scores[category];
      best = category;
    }
  }
  return { category: best, scores };
}

// Keyword-only categorizer for general-reader feeds (home).
export function categorizeArticleKeyword(
  title: string,
  summary: string | undefined,
  fallback: Category,
): { category: Category; scores: Record<Category, number> } {
  const scores = scoreCategoriesKeyword(`${title} ${summary ?? ""}`);
  let best = fallback;
  let bestScore = 0;
  for (const category of SHARED_CATEGORIES) {
    if (scores[category] > bestScore) {
      bestScore = scores[category];
      best = category;
    }
  }
  return { category: best, scores };
}

export function maxScore(scores: Partial<Record<Category, number>> | undefined): number {
  if (!scores) return 0;
  let max = 0;
  for (const category of SHARED_CATEGORIES) {
    const value = scores[category];
    if (typeof value === "number" && value > max) max = value;
  }
  return max;
}

export const categoryShortLabels: Record<Category, string> = {
  "Power & grid": "PWR",
  "Policy & controls": "POL",
  "Hardware & compute": "HW",
  "Capital & costs": "CAP",
  "Technology & research": "R&D",
};
