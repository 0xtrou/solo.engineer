import { maxScore, SHARED_CATEGORIES, type Category } from "@/lib/categories";
import { domainToSourceId, registrableDomain } from "@/lib/source-domains";

type Item = {
  source?: string;
  sourceId?: string;
  title: string;
  summary?: string;
  url: string;
  publishedAt?: string;
  category?: string;
  categoryScores?: Partial<Record<Category, number>>;
};

export type SourceQuality = {
  avgScore: number;
  yieldPct: number;       // provenance yield: % of items scoring > 0
  scored: number;
  total: number;
  citations: number;      // in-degree: how often other sources mention this source
  freshness: number;      // 0-1: items in last 7d / total
  authority: Partial<Record<Category, number>>;  // category distribution % per source
  composite: number;      // 0-100 weighted score
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const tierRank = (tier?: string): number => {
  if (!tier) return 2;
  if (tier.startsWith("T1")) return 0;
  if (tier.startsWith("T2")) return 1;
  return 2;
};

// Per-source quality metrics. Items keyed by source field (home uses `source`,
// terminal uses `sourceId`). Pass the right key via sourceKey.
export function computeSourceQuality<T extends Item>(
  items: T[],
  opts: {
    sourceKey: (item: T) => string;
    tierFor: (sourceId: string) => string | undefined;
    citationMap?: Map<string, number>;
  },
): Map<string, SourceQuality> {
  const bySource = new Map<string, T[]>();
  for (const item of items) {
    const key = opts.sourceKey(item);
    const arr = bySource.get(key) ?? [];
    arr.push(item);
    bySource.set(key, arr);
  }

  const result = new Map<string, SourceQuality>();
  const now = Date.now();
  const maxCitations = opts.citationMap ? Math.max(1, ...opts.citationMap.values()) : 1;

  for (const [sourceId, sourceItems] of bySource) {
    const total = sourceItems.length;
    const scored = sourceItems.filter((i) => maxScore(i.categoryScores) > 0).length;
    const peakSum = sourceItems.reduce((acc, i) => acc + maxScore(i.categoryScores), 0);
    const avgScore = total > 0 ? peakSum / total : 0;
    const yieldPct = total > 0 ? (scored / total) * 100 : 0;

    const fresh = sourceItems.filter((i) => {
      const ts = i.publishedAt ? Date.parse(i.publishedAt) : NaN;
      return Number.isFinite(ts) && now - ts < WEEK_MS;
    }).length;
    const freshness = total > 0 ? fresh / total : 0;

    // Category authority profile
    const authority: Partial<Record<Category, number>> = {};
    for (const cat of SHARED_CATEGORIES) {
      const count = sourceItems.filter((i) => i.category === cat).length;
      if (count > 0) authority[cat] = total > 0 ? (count / total) * 100 : 0;
    }

    const citations = opts.citationMap?.get(sourceId) ?? 0;
    const citationNorm = citations / maxCitations;

    // Composite: yield 0.40, tier 0.25, freshness 0.15, yield/volume 0.10, citation 0.10
    const tier = opts.tierFor(sourceId);
    const tierScore = 1 - (tierRank(tier) / 2);  // T1=1, T2=0.5, T3=0
    const yieldVolRatio = total > 0 ? scored / Math.max(total, 7) : 0;
    const composite = Math.round(
      (yieldPct / 100) * 0.40 * 100
      + tierScore * 0.25 * 100
      + freshness * 0.15 * 100
      + Math.min(yieldVolRatio, 1) * 0.10 * 100
      + citationNorm * 0.10 * 100,
    );

    result.set(sourceId, { avgScore, yieldPct, scored, total, citations, freshness, authority, composite });
  }

  return result;
}

// Citation in-degree: scan all items' title+summary for mentions of any source's domain.
// Returns Map<sourceId, count of items citing that source>.
export function citationInDegree<T extends Item>(
  items: T[],
  sourceDomains: Map<string, Set<string>>,
  sourceKey: (item: T) => string,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const ownSource = sourceKey(item);
    // Extract candidate domains from summary + title text.
    const text = `${item.title} ${item.summary ?? ""}`.toLowerCase();
    const urlMatches = text.match(/https?:\/\/[^\s)<>"']+/g) ?? [];
    const bareDomainMatches = text.match(/\b([a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2,})?)\b/g) ?? [];
    const candidates = [...urlMatches.map((u) => registrableDomain(u)), ...bareDomainMatches];
    const cited = new Set<string>();
    for (const candidate of candidates) {
      if (!candidate) continue;
      const sourceId = domainToSourceId(candidate, sourceDomains);
      if (sourceId && sourceId !== ownSource) cited.add(sourceId);
    }
    for (const sourceId of cited) counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1);
  }
  return counts;
}
