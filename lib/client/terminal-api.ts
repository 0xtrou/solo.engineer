import { scoreCategories } from "@/lib/categories";
import { isTerminalRegion, type TerminalArticle, TerminalFeedResponse, type TerminalCategory } from "@/lib/terminal-feed";

type CanonicalTerminal = { data: Array<{ id: string; sourceId: string; title: string; excerpt?: string | null; canonicalUrl: string; publishedAt: string; category?: string | null; region?: string | null }>; overview: { sourceHealth: Array<{ sourceId: string; name: string; homepageUrl: string; endpointUrl: string; region?: string | null; category?: string | null; lastSuccessAt?: string | null; lastItemCount?: number; lastError?: string | null }> }; asOf: string };
const categories: Record<string, TerminalCategory> = {
  "power-and-grid": "Power & grid",
  "policy-and-controls": "Policy & controls",
  "hardware-and-compute": "Hardware & compute",
  "capital-and-costs": "Capital & costs",
  "technology-and-research": "Technology & research",
};

function fromCanonical(payload: CanonicalTerminal): TerminalFeedResponse {
  const health = new Map(payload.overview.sourceHealth.map((source) => [source.sourceId, source]));
  const items: TerminalArticle[] = payload.data.flatMap((record) => {
    const source = health.get(record.sourceId);
    const region = record.region;
    if (!source || !isTerminalRegion(region)) return [];
    const category = categories[record.category ?? ""];
    if (!category) return [];
    return [{ id: record.id, region, category, categoryScores: scoreCategories(`${record.title} ${record.excerpt ?? ""}`), sourceId: record.sourceId, sourceName: source.name, sourceHomepage: source.homepageUrl, title: record.title, url: record.canonicalUrl, publishedAt: record.publishedAt, summary: record.excerpt ?? undefined }];
  });
  return {
    items,
    statuses: payload.overview.sourceHealth.flatMap((source) => {
      const region = source.region;
      const category = categories[source.category ?? ""];
      if (!isTerminalRegion(region) || !category) return [];
      return [{ sourceId: source.sourceId, region, category, name: source.name, homepage: source.homepageUrl, endpoint: source.endpointUrl, loaded: !source.lastError, itemCount: source.lastItemCount ?? 0, message: source.lastError ?? undefined }];
    }),
    fetchedAt: payload.asOf,
  };
}

export async function fetchTerminal(signal?: AbortSignal): Promise<TerminalFeedResponse> {
  const response = await fetch("/api/terminal", { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Terminal request failed");
  const payload = await response.json() as TerminalFeedResponse | CanonicalTerminal;
  return "overview" in payload ? fromCanonical(payload) : payload;
}
