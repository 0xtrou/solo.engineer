import type { FeedItem, FeedResponse, SourceId } from "@/lib/types";
import { sourceMeta } from "@/lib/source-meta";

type CanonicalResponse = { data: Array<{ id: string; sourceId: string; title: string; excerpt?: string | null; author?: string | null; canonicalUrl: string; publishedAt: string; score?: number | null; comments?: number | null; category?: string | null }>; page: { asOf: string }; meta?: { sourceHealth?: { healthy: number; empty: number; failed: number } } };

function fromCanonical(payload: CanonicalResponse): FeedResponse {
  const items: FeedItem[] = payload.data.flatMap((record) => {
    if (!(record.sourceId in sourceMeta)) return [];
    return [{
      id: record.id,
      source: record.sourceId as SourceId,
      title: record.title,
      summary: record.excerpt ?? "",
      author: record.author ?? sourceMeta[record.sourceId as SourceId].label,
      url: record.canonicalUrl,
      publishedAt: record.publishedAt,
      score: record.score ?? undefined,
      comments: record.comments ?? undefined,
      tag: record.category ?? undefined,
    }];
  });
  return { items, statuses: [], fetchedAt: payload.page.asOf };
}

export async function fetchFeed(params: { category: string; sources: string; query?: string }, signal?: AbortSignal): Promise<FeedResponse> {
  const search = new URLSearchParams();
  if (params.category !== "all") search.set("category", params.category);
  if (params.sources !== "all") search.set("sources", params.sources);
  if (params.query) search.set("q", params.query);
  const response = await fetch(`/api/feed?${search.toString()}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Feed request failed");
  const payload = await response.json() as FeedResponse | CanonicalResponse;
  return "data" in payload ? fromCanonical(payload) : payload;
}
