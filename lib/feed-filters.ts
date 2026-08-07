import { parseSearchWith, stringifySearchWith } from "@tanstack/react-router";
import { z } from "zod";
import type { SourceId } from "@/lib/types";

export const feedViewIds = ["focused", "research", "policy"] as const;
export type FeedView = (typeof feedViewIds)[number];

const feedViewLabels: Record<FeedView, string> = {
  focused: "Focused",
  research: "Research & AI",
  policy: "Policy & economy",
};

export const researchSourceIds = [
  "arxiv",
  "hacker-news",
  "github",
  "stack-overflow",
  "dev",
  "indie-hackers",
  "bluesky",
  "openalex",
  "hugging-face",
  "microsoft-research",
  "google-ai",
  "mit-sloan",
  "social-media-today",
  "wikimedia",
  "creative-commons",
  "open-knowledge-foundation",
  "openstreetmap",
  "internet-archive",
  "learning-equality",
  "carpentries",
  "public-knowledge-project",
  "center-for-open-science",
  "numfocus",
  "open-source-ecology",
  "open-education-global",
  "oapen",
  "open-food-facts",
  "apereo",
  "posit",
  "moodle",
  "h5p",
  "canvas-lms",
  "overleaf",
  "pensoft",
  "frontiers",
  "automattic",
  "proton",
  "plausible",
  "matomo",
] as const satisfies readonly SourceId[];

export const policySourceIds = ["eu-regulation", "us-regulation", "vietnam-regulation", "baochinhphu", "world-bank"] as const satisfies readonly SourceId[];

export const selectableSourceIds = [...researchSourceIds, ...policySourceIds] as const satisfies readonly SourceId[];
export type SelectableSourceId = (typeof selectableSourceIds)[number];
export type SelectedSource = SelectableSourceId | "all";

export type FeedFilters = {
  source: SelectedSource;
  view: FeedView;
  query: string;
  saved: boolean;
};

const selectableSourceSet = new Set<string>(selectableSourceIds);
const feedViewSet = new Set<string>(feedViewIds);

const feedSearchSchema = z.object({
  source: z.enum(selectableSourceIds).optional().catch(undefined),
  view: z.enum(feedViewIds).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  saved: z.literal("1").optional().catch(undefined),
}).passthrough();

const parseSearch = parseSearchWith((value) => value);
const stringifySearch = stringifySearchWith((value) => JSON.stringify(value));

export const defaultFeedFilters: FeedFilters = {
  source: "all",
  view: "focused",
  query: "",
  saved: false,
};

export function slugifyFeedCategory(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getFeedCategorySlug(view: FeedView): string {
  return slugifyFeedCategory(feedViewLabels[view]);
}

export function getFeedSourceRequest(filters: Pick<FeedFilters, "source" | "view">): string {
  if (filters.source !== "all") return filters.source;
  if (filters.view === "research") return researchSourceIds.join(",");
  if (filters.view === "policy") return policySourceIds.join(",");
  return "all";
}

export function normalizeFeedFilters(filters: FeedFilters): FeedFilters {
  return {
    source: selectableSourceSet.has(filters.source) ? filters.source : "all",
    view: feedViewSet.has(filters.view) ? filters.view : "focused",
    query: filters.query.trim().slice(0, 140),
    saved: filters.saved,
  };
}

export function parseFeedFilters(search: string): FeedFilters {
  const parsed = feedSearchSchema.parse(parseSearch(search));

  return normalizeFeedFilters({
    source: parsed.source ?? "all",
    view: parsed.view ?? "focused",
    query: parsed.q ?? "",
    saved: parsed.saved === "1",
  });
}

export function writeFeedFilters(filters: FeedFilters, currentSearchParams: URLSearchParams): URLSearchParams {
  const normalized = normalizeFeedFilters(filters);
  const next = new URLSearchParams(currentSearchParams);

  next.delete("source");
  next.delete("view");
  next.delete("q");
  next.delete("saved");

  if (normalized.source !== "all") next.set("source", normalized.source);
  if (normalized.view !== "focused") next.set("view", normalized.view);
  if (normalized.query) next.set("q", normalized.query);
  if (normalized.saved) next.set("saved", "1");

  return new URLSearchParams(stringifySearch(Object.fromEntries(next.entries())).slice(1));
}
