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

export async function fetchFeed(signal?: AbortSignal): Promise<FeedResponse> {
  const response = await fetch("/api/feed", { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Feed request failed");
  const payload = await response.json() as FeedResponse | CanonicalResponse;
  return "data" in payload ? fromCanonical(payload) : payload;
}
