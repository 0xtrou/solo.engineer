export const SHARED_CATEGORIES = [
  "Power & grid",
  "Policy & controls",
  "Hardware & compute",
  "Capital & costs",
  "Technology & research",
] as const;

export type Category = (typeof SHARED_CATEGORIES)[number];

export const categoryKeywords: Record<Category, string[]> = {
  "Power & grid": ["power", "electricity", "grid", "energy", "generation", "transmission", "battery", "storage", "lng", "natural gas", "nuclear", "solar", "wind", "substation", "transformer", "turbine", "renewable", "电力", "能源", "电网", "储能", "风电", "光伏", "核电", "điện", "điện lực", "lưới điện", "năng lượng", "năng lượng tái tạo", "cooling", "hyperscale", "submarine", "colocation"],
  "Policy & controls": ["policy", "regulation", "rule", "ban", "export control", "sanction", "tariff", "compliance", "directive", "order", "federal register", "cybersecurity", "privacy", "antitrust", "approval", "law", "政策", "监管", "管制", "出口", "禁令", "反垄断", "chính sách", "quy định", "cấm", "chống độc quyền"],
  "Hardware & compute": ["chip", "semiconductor", "gpu", "cpu", "tpu", "wafer", "fab", "foundry", "node", "transistor", "memory", "hbm", "tsmc", "samsung", "sk hynix", "micron", "smic", "huawei", "nvidia", "intel", "amd", "芯片", "半导体", "集成电路", "算力", "bán dẫn", "vi mạch", "colo"],
  "Capital & costs": ["billion", "million", "funding", "raise", "ipo", "investment", "capex", "valuation", "venture", "vc", "deal", "cost", "price", "fdi", "factory", "industrial park", "投资", "融资", "亿元", "đầu tư", "vốn", "kêu gọi"],
  "Technology & research": ["ai ", "ai,", "ai.", "artificial intelligence", "llm", "model", "training", "inference", "algorithm", "research", "r&d", "breakthrough", "openai", "deepmind", "deepseek", "transformer", "robotics", "人工智能", "模型", "研发", "深度求索", "trí tuệ nhân tạo", "chuyển đổi số", "công nghệ", "đổi mới"],
};

const emptyScores: Record<Category, number> = {
  "Power & grid": 0,
  "Policy & controls": 0,
  "Hardware & compute": 0,
  "Capital & costs": 0,
  "Technology & research": 0,
};

export function scoreCategories(text: string): Record<Category, number> {
  const lower = text.toLowerCase();
  const scores: Record<Category, number> = { ...emptyScores };
  for (const category of SHARED_CATEGORIES) {
    const terms = categoryKeywords[category];
    let count = 0;
    for (const term of terms) {
      if (lower.includes(term)) count += 1;
    }
    scores[category] = count;
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

export function maxScore(scores: Record<Category, number>): number {
  let max = 0;
  for (const category of SHARED_CATEGORIES) {
    if (scores[category] > max) max = scores[category];
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
