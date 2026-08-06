"use client";

import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Compass,
  ExternalLink,
  Flame,
  GitFork,
  GraduationCap,
  Hash,
  Home,
  Landmark,
  Leaf,
  MessageCircle,
  Microscope,
  Plus,
  Radio,
  RefreshCw,
  Scale,
  Search,
  Share2,
  Sparkles,
  Users,
  Building2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchFeed } from "@/lib/client/feed-api";
import { CategoryScores } from "@/components/category-scores";
import { maxScore } from "@/lib/categories";
import {
  defaultFeedFilters,
  getFeedCategorySlug,
  getFeedSourceRequest,
  parseFeedFilters,
  policySourceIds,
  researchSourceIds,
  type FeedFilters,
  type FeedView,
  type SelectedSource,
  writeFeedFilters,
} from "@/lib/feed-filters";
import { matchesFeedSearch } from "@/lib/feed-search";
import { sourceMeta } from "@/lib/source-meta";
import type { FeedItem, FeedResponse, SourceId } from "@/lib/types";

type FeedDashboardProps = { initialFeed?: FeedResponse };
type ToastKind = "success" | "warning";
type Toast = { message: string; kind?: ToastKind } | null;

const sourceIcons: Record<SourceId, typeof Sparkles> = {
  arxiv: GraduationCap,
  "hacker-news": Flame,
  github: GitFork,
  "stack-overflow": Hash,
  dev: Leaf,
  "indie-hackers": Users,
  "eu-regulation": Landmark,
  "us-regulation": Scale,
  "vietnam-regulation": Building2,
  "world-bank": Landmark,
  openalex: BookOpenCheck,
  "hugging-face": Bot,
  "microsoft-research": Microscope,
  "google-ai": BrainCircuit,
  "mit-sloan": BriefcaseBusiness,
  "social-media-today": Share2,
  wikimedia: BookOpenCheck,
  "creative-commons": Scale,
  "open-knowledge-foundation": Landmark,
  openstreetmap: Landmark,
  "internet-archive": BookOpenCheck,
  "learning-equality": GraduationCap,
  carpentries: GraduationCap,
  "public-knowledge-project": BookOpenCheck,
  "center-for-open-science": Microscope,
  numfocus: BrainCircuit,
  "open-source-ecology": GitFork,
  "open-education-global": GraduationCap,
  oapen: BookOpenCheck,
  "open-food-facts": Leaf,
  osgeo: Landmark,
  apereo: GraduationCap,
  posit: BriefcaseBusiness,
  moodle: GraduationCap,
  h5p: BookOpenCheck,
  "canvas-lms": GraduationCap,
  overleaf: BookOpenCheck,
  pensoft: Microscope,
  frontiers: Microscope,
  automattic: GitFork,
  proton: Scale,
  plausible: BriefcaseBusiness,
  matomo: BriefcaseBusiness,
  mastodon: Radio,
  bluesky: Leaf,
  hashnode: Hash,
  discord: MessageCircle,
};

const mobileSourceIds = [...researchSourceIds, ...policySourceIds];

function getInitials(author: string) {
  const initials = author
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "S";
}

function toDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  const difference = Date.now() - date.getTime();
  if (difference < 60_000) return "now";
  if (difference < 3_600_000) return `${Math.max(1, Math.round(difference / 60_000))}m`;
  if (difference < 86_400_000) return `${Math.round(difference / 3_600_000)}h`;
  if (difference < 604_800_000) return `${Math.round(difference / 86_400_000)}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCount(value: number | undefined) {
  if (!value) return "0";
  return value > 999 ? `${(value / 1000).toFixed(value > 9_999 ? 0 : 1)}k` : value.toString();
}

function SourceMark({ source, size = 15 }: { source: SourceId; size?: number }) {
  const Icon = sourceIcons[source];
  return <Icon size={size} strokeWidth={2.2} aria-hidden="true" />;
}

function Avatar({ item }: { item: FeedItem }) {
  const source = sourceMeta[item.source];
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: source.accent }}>
      {getInitials(item.author)}
    </span>
  );
}

function SourcePill({ source }: { source: SourceId }) {
  const meta = sourceMeta[source];
  return (
    <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: meta.accent }}>
      <SourceMark source={source} size={13} />
      {meta.label}
    </span>
  );
}

function FeedCard({ item, saved, upvoted, onToggleSave, onToggleVote }: {
  item: FeedItem;
  saved: boolean;
  upvoted: boolean;
  onToggleSave: (id: string) => void;
  onToggleVote: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const summaryNeedsToggle = item.summary.length > 185;

  return (
    <article className="border-b border-[#ebece7] py-5 first:pt-4" data-testid="feed-card" data-source={item.source}>
      <div className="ml-12 flex h-5 items-center gap-1.5 text-[11px] text-[#9aa09b]">
        <SourcePill source={item.source} />
        <span>·</span>
        <time dateTime={item.publishedAt}>{toDateLabel(item.publishedAt)}</time>
        <a className="ml-auto grid h-6 w-6 place-items-center rounded text-[#929995] hover:bg-[#f0f1ed] hover:text-[#343a37]" href={item.url} target="_blank" rel="noreferrer" aria-label={`Open ${item.title}`}>
          <ExternalLink size={15} />
        </a>
      </div>

      <div className="mt-1 grid grid-cols-[36px_minmax(0,1fr)] gap-3">
        <Avatar item={item} />
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-x-1.5 text-[11px] leading-4">
            <span className="font-semibold text-[#303632]">{item.author}</span>
            {item.authorHandle && <span className="text-[#929894]">{item.authorHandle}</span>}
            {item.tag && <span className="text-[#8c938f]">in <span className="font-medium text-[#68716c]">{item.tag}</span></span>}
          </div>
          <a href={item.url} target="_blank" rel="noreferrer" className="group block">
            <h2 className="font-display text-[18px] leading-[1.22] tracking-[-0.45px] text-[#222725] group-hover:text-[#d65d40] sm:text-[19px]">{item.title}</h2>
          </a>
          {item.summary && (
            <p className={`mt-1.5 max-w-[570px] text-[12.5px] leading-[1.5] text-[#68706b] ${expanded ? "" : "line-clamp-2"}`}>
              {item.summary}
            </p>
          )}
          {summaryNeedsToggle && (
            <button className="mt-1 flex items-center gap-0.5 text-[11px] font-semibold text-[#d76346] hover:text-[#b94e37]" onClick={() => setExpanded((value) => !value)}>
              {expanded ? "Show less" : "Read more"} <ChevronRight size={14} className={expanded ? "rotate-90" : ""} />
            </button>
          )}
          {item.categoryScores && (
            <div className="mt-2">
              <CategoryScores scores={item.categoryScores} testId="feed-category-scores" activeColor="#d76346" mutedColor="#9aa09b" />
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-[#929994]">
            <div className="flex items-center gap-1.5">
              <button className={`grid h-6 w-5 place-items-center rounded transition hover:bg-[#fae9e4] hover:text-[#d85f42] ${upvoted ? "text-[#dc6447]" : ""}`} onClick={() => onToggleVote(item.id)} aria-label="Upvote">
                <ArrowUp size={17} />
              </button>
              <span className="min-w-5 text-center font-mono text-[11px]">{formatCount((item.score ?? 0) + (upvoted ? 1 : 0))}</span>
              <button className="grid h-6 w-5 place-items-center rounded transition hover:bg-[#f0f1ed] hover:text-[#454b48]" aria-label="Downvote">
                <ArrowDown size={17} />
              </button>
            </div>
            <a className="flex items-center gap-1.5 hover:text-[#d85f42]" href={item.url} target="_blank" rel="noreferrer" aria-label="View discussion">
              <MessageCircle size={17} />
              <span className="font-mono text-[11px]">{formatCount(item.comments)}</span>
            </a>
            <button className={`flex items-center gap-1.5 transition hover:text-[#c97731] ${saved ? "text-[#c97731]" : ""}`} onClick={() => onToggleSave(item.id)} aria-label={saved ? "Remove bookmark" : "Save bookmark"}>
              <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
              <span className="font-mono text-[11px]">Save</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function feedMatchesFilters(item: FeedItem, filters: FeedFilters, saved: Set<string>) {
  if (filters.source !== "all" && item.source !== filters.source) return false;
  if (filters.view === "research" && !(researchSourceIds as readonly SourceId[]).includes(item.source)) return false;
  if (filters.view === "policy" && !(policySourceIds as readonly SourceId[]).includes(item.source)) return false;
  if (filters.saved && !saved.has(item.id)) return false;

  return matchesFeedSearch(item, filters.query);
}

export function FeedDashboard({ initialFeed }: FeedDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFeedFilters(searchParams.toString()), [searchParams]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<Toast>(null);
  const categorySlug = getFeedCategorySlug(filters.view);
  const sourceRequest = getFeedSourceRequest(filters);
  const feedQuery = useQuery<FeedResponse>({
    queryKey: ["feed", { category: categorySlug, source: sourceRequest, query: filters.query }],
    queryFn: ({ signal }) => fetchFeed({ category: categorySlug, sources: sourceRequest, query: filters.query }, signal),
    initialData: initialFeed,
    placeholderData: (previous) => previous,
    staleTime: 300_000,
    refetchOnReconnect: true,
  });
  const feed = feedQuery.data;

  const notify = useCallback((message: string, kind: ToastKind = "success") => {
    setToast({ message, kind });
  }, []);

  const updateFilters = useCallback((patch: Partial<FeedFilters>) => {
    const next = { ...filters, ...patch };
    const nextSearchParams = writeFeedFilters(next, new URLSearchParams(searchParams.toString()));
    const queryString = nextSearchParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [filters, pathname, router, searchParams]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem("signal-saved-posts");
      if (stored) setSaved(new Set(JSON.parse(stored) as string[]));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const refresh = useCallback(async () => {
    try {
      const nextFeed = await feedQuery.refetch();
      if (nextFeed.isError) throw nextFeed.error;
      const unavailable = (nextFeed.data ?? feed)?.statuses.filter((status) => !status.loaded) ?? [];
      notify(unavailable.length ? `Updated — ${unavailable.length} source${unavailable.length > 1 ? "s" : ""} unavailable` : "Your feed is fresh");
    } catch {
      notify("Could not refresh right now", "warning");
    }
  }, [feedQuery, feed, notify]);

  const toggleSave = (id: string) => {
    setSaved((current) => {
      const next = new Set(current);
      const isSaved = next.has(id);
      if (isSaved) next.delete(id);
      else next.add(id);
      window.localStorage.setItem("signal-saved-posts", JSON.stringify([...next]));
      notify(isSaved ? "Removed from local library" : "Saved to local library");
      return next;
    });
  };

  const toggleVote = (id: string) => {
    setUpvoted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleItems = useMemo(() => {
    if (!feed) return [];
    const items = feed.items.filter((item) => feedMatchesFilters(item, filters, saved));
    return items;
  }, [feed, filters, saved]);

  const sourceAvgScore = useMemo(() => {
    const totals = new Map<string, number>();
    const counts = new Map<string, number>();
    for (const item of feed?.items ?? []) {
      const peak = maxScore(item.categoryScores);
      totals.set(item.source, (totals.get(item.source) ?? 0) + peak);
      counts.set(item.source, (counts.get(item.source) ?? 0) + 1);
    }
    const avg = new Map<string, number>();
    for (const [source, total] of totals) avg.set(source, counts.has(source) ? total / (counts.get(source) ?? 1) : 0);
    return avg;
  }, [feed]);
  const tierIndexOf = useCallback((source: SourceId) => {
    const tier = sourceMeta[source]?.tier;
    return tier === "T1" ? 0 : tier === "T2" ? 1 : 2;
  }, []);
  const sortedResearchSources = useMemo(() => [...researchSourceIds].sort((a, b) => tierIndexOf(a) - tierIndexOf(b)), [tierIndexOf]);
  const sortedPolicySources = useMemo(() => [...policySourceIds].sort((a, b) => tierIndexOf(a) - tierIndexOf(b)), [tierIndexOf]);

  const loadedCount = feed?.statuses.filter((status) => status.loaded).length ?? 0;
  const unavailableStatuses = feed?.statuses.filter((status) => !status.loaded) ?? [];
  const isRefreshing = feedQuery.isFetching;

  const setSource = (source: SelectedSource) => {
    const sourceIsResearch = (researchSourceIds as readonly SourceId[]).includes(source as SourceId);
    const sourceIsPolicy = (policySourceIds as readonly SourceId[]).includes(source as SourceId);
    const nextView = (filters.view === "research" && sourceIsPolicy) || (filters.view === "policy" && sourceIsResearch)
      ? "focused"
      : filters.view;

    updateFilters({ source, view: nextView, saved: false });
  };
  const setView = (view: FeedView) => {
    const sourceMatchesView = view === "focused"
      || (view === "research" && (filters.source === "all" || researchSourceIds.includes(filters.source as (typeof researchSourceIds)[number])))
      || (view === "policy" && (filters.source === "all" || policySourceIds.includes(filters.source as (typeof policySourceIds)[number])));
    updateFilters({ view, source: sourceMatchesView ? filters.source : "all" });
  };
  const resetFilters = () => updateFilters(defaultFeedFilters);

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#202426]">
      <div className="mx-auto grid min-h-screen max-w-[1480px] grid-cols-1 lg:items-start lg:grid-cols-[236px_minmax(570px,1fr)] xl:grid-cols-[236px_minmax(570px,1fr)_340px]">
        <aside className="hidden min-h-screen border-r border-[#e4e6e1] bg-[#fbfcfa] px-[18px] py-7 lg:sticky lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto lg:overscroll-contain lg:flex-col" data-testid="feed-left-sidebar">
          <button className="flex items-center gap-2.5 px-3 text-[25px] font-bold tracking-[-1.3px]" onClick={resetFilters} aria-label="Show all signals">
            <span className="relative grid h-6 w-6 place-items-center -rotate-12"><i className="absolute h-[7px] w-[7px] -translate-x-1.5 translate-y-1.5 rounded-full bg-[#e8bd4d]" /><i className="absolute h-[7px] w-[7px] translate-x-1.5 translate-y-1.5 rounded-full bg-[#f27252]" /><i className="absolute h-[7px] w-[7px] -translate-y-1.5 rounded-full bg-[#263e52]" /></span>
            <span className="font-display">signal</span>
          </button>

          <nav className="mt-10 space-y-1" aria-label="Primary navigation">
            <button className={`nav-item ${!filters.saved ? "nav-item-active" : ""}`} onClick={() => updateFilters({ saved: false })}><Home size={19} /> Home</button>
            <Link className="nav-item" href="/terminal"><Compass size={19} /> AI Infra Terminal</Link>
            <button className={`nav-item ${filters.saved ? "nav-item-active" : ""}`} onClick={() => updateFilters({ saved: !filters.saved })}><Bookmark size={19} /> Library <span className="ml-auto font-mono text-[10px] font-medium text-[#8e9590]">{saved.size}</span></button>
          </nav>

          <div className="mt-9 flex items-center justify-between px-2.5 font-mono text-[10px] tracking-[.8px] text-[#989f9a]">
            <span>YOUR SOURCES</span>
            <button className="rounded p-0.5 hover:bg-[#edf0ec]" onClick={() => notify("Sources are configured in your local environment")} aria-label="Source settings"><Plus size={16} /></button>
          </div>
          <nav className="mt-2 space-y-1" aria-label="Research sources">
            <button className={`source-item ${filters.source === "all" ? "source-item-active" : ""}`} onClick={() => setSource("all")} data-testid="source-filter-all"><Sparkles size={16} /> All sources <span>{feed?.items.length ?? 0}</span></button>
            {sortedResearchSources.map((source) => {
              const score = sourceAvgScore.get(source) ?? 0;
              return (
                <button key={source} className={`source-item ${filters.source === source ? "source-item-active" : ""}`} onClick={() => setSource(source)} data-testid={`source-filter-${source}`}>
                  <span style={{ color: sourceMeta[source].accent }}><SourceMark source={source} size={16} /></span>{sourceMeta[source].label}
                  {score > 0 && <span className="text-[#d76346]">{score.toFixed(1)}</span>}
                </button>
              );
            })}
          </nav>
          <button className="mt-3 flex items-center gap-2 px-2.5 text-[12px] font-semibold text-[#7c847f] hover:text-[#27302b]" onClick={() => notify("Discord and Hashnode need optional local adapters; see .env.example")}><Plus size={16} /> Add local source</button>
          <div className="mt-4 px-2.5 font-mono text-[10px] tracking-[.8px] text-[#989f9a]">POLICY & ECONOMY</div>
          <nav className="mt-2 space-y-1" aria-label="Policy and economy sources">
            {sortedPolicySources.map((source) => {
              const score = sourceAvgScore.get(source) ?? 0;
              return (
                <button key={source} className={`source-item ${filters.source === source ? "source-item-active" : ""}`} onClick={() => setSource(source)} data-testid={`source-filter-${source}`}>
                  <span style={{ color: sourceMeta[source].accent }}><SourceMark source={source} size={16} /></span>{sourceMeta[source].label}
                  {score > 0 && <span className="text-[#d76346]">{score.toFixed(1)}</span>}
                </button>
              );
            })}
          </nav>
          <p className="mt-auto px-2.5 text-[10px] leading-5 text-[#9ba19c]">Professional personal reader<br />No account or tracking.</p>
        </aside>

        <section className="min-w-0 bg-[#fffdfb] px-5 sm:px-9 lg:px-11">
          <header className="flex h-[calc(58px+env(safe-area-inset-top))] items-center justify-between border-b border-[#e7e8e2] pt-[env(safe-area-inset-top)] lg:hidden">
            <button className="flex items-center gap-2" onClick={resetFilters} aria-label="Show all signals">
              <span className="relative grid h-5 w-5 place-items-center -rotate-12" aria-hidden="true"><i className="absolute h-[6px] w-[6px] -translate-x-1 translate-y-1 rounded-full bg-[#e8bd4d]" /><i className="absolute h-[6px] w-[6px] translate-x-1 translate-y-1 rounded-full bg-[#f27252]" /><i className="absolute h-[6px] w-[6px] -translate-y-1 rounded-full bg-[#263e52]" /></span>
              <span className="font-display text-xl font-bold tracking-tight">signal</span>
            </button>
            <div className="flex items-center gap-1">
              <Link className="rounded-md px-2 py-1.5 text-[11px] font-semibold text-[#5f6d67] hover:bg-[#f0f1ed] hover:text-[#202725]" href="/terminal">Terminal</Link>
              <button className="rounded-md p-2 text-[#6c746f] hover:bg-[#f0f1ed] disabled:cursor-wait disabled:opacity-60" onClick={() => void refresh()} disabled={isRefreshing} aria-label="Refresh feed"><RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} /></button>
            </div>
          </header>
          <div className="flex items-start justify-between gap-4 pb-5 pt-8 sm:pb-6 sm:pt-11">
            <div>
              <p className="font-mono text-[10px] font-medium tracking-[.95px] text-[#8f9792]">PERSONAL WEB READER</p>
              <h1 className="mt-2 font-display text-[27px] font-semibold tracking-[-1.1px] text-[#222725] sm:text-[31px]">Worth your attention <span className="font-sans text-[20px] text-[#e7af4a]">✦</span></h1>
              <p className="mt-1.5 text-[13px] text-[#818883]">{loadedCount} live sources for research, technology, policy, and growth.</p>
            </div>
            <div className="mt-1 hidden items-center gap-2 sm:flex">
              <Link className="inline-flex items-center gap-1.5 rounded-md border border-[#dedfd9] bg-[#fffefa] px-2.5 py-1.5 text-[11px] font-medium text-[#596762] shadow-sm hover:border-[#cfd2cc] hover:text-[#26342e]" href="/terminal"><Compass size={14} /> AI Infra Terminal</Link>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-[#dedfd9] bg-[#fffefa] px-2.5 py-1.5 text-[11px] font-medium text-[#717975] shadow-sm hover:border-[#cfd2cc] disabled:cursor-wait disabled:opacity-60" onClick={() => void refresh()} disabled={isRefreshing}>
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> {isRefreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </div>

          <div className="flex h-11 items-center justify-between border-b border-[#e6e6e0]">
            <nav className="tab-scroll -mx-5 flex h-full min-w-0 gap-6 overflow-x-auto px-5 sm:mx-0 sm:px-0" aria-label="Feed views">
              {([ ["focused", "Focused"], ["research", "Research & AI"], ["policy", "Policy & economy"] ] as const).map(([id, label]) => (
                <button key={id} className={`tab-button shrink-0 whitespace-nowrap ${filters.view === id ? "tab-button-active" : ""}`} onClick={() => setView(id)} data-testid={`view-filter-${id}`}>{label}</button>
              ))}
            </nav>
            <button className="ml-2 shrink-0 text-[11px] font-semibold text-[#818984] hover:text-[#3d4540] lg:flex lg:items-center lg:gap-1.5" onClick={() => notify("Use research, policy, and source filters to tune your feed")} aria-label="How to tune the feed"><ChevronDown size={15} className="lg:hidden" /><span className="hidden lg:inline">Tune</span></button>
          </div>

          <nav className="tab-scroll -mx-5 flex gap-2 overflow-x-auto border-b border-[#e6e6e0] px-5 py-3 lg:hidden" aria-label="Filter feed by source">
            <button className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${filters.source === "all" ? "border-[#263e52] bg-[#263e52] text-white" : "border-[#dde0da] bg-white text-[#59615c]"}`} onClick={() => setSource("all")}>All</button>
            {[...mobileSourceIds].sort((a, b) => tierIndexOf(a) - tierIndexOf(b)).map((source) => (
              <button key={source} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${filters.source === source ? "border-[#d76346] bg-[#fff2ed] text-[#a94833]" : "border-[#dde0da] bg-white text-[#59615c]"}`} onClick={() => setSource(source)}>
                <span style={{ color: sourceMeta[source].accent }}><SourceMark source={source} size={13} /></span>
                {sourceMeta[source].label}
              </button>
            ))}
          </nav>

          {unavailableStatuses.length > 0 && (
            <div className="mt-4 flex gap-2 rounded-md border border-[#f0dfc9] bg-[#fff7eb] px-3 py-2 text-[11px] leading-4 text-[#856644]">
              <CircleAlert size={15} className="mt-0.5 shrink-0" />
              <span>{unavailableStatuses.map((status) => sourceMeta[status.source].label).join(", ")} unavailable right now. Other live sources remain in your feed.</span>
            </div>
          )}

          <div className="pb-28 pt-0 xl:pb-10" aria-live="polite">
            {visibleItems.map((item) => <FeedCard key={item.id} item={item} saved={saved.has(item.id)} upvoted={upvoted.has(item.id)} onToggleSave={toggleSave} onToggleVote={toggleVote} />)}
            {visibleItems.length === 0 && (
              <div className="grid place-items-center py-24 text-center" data-testid="empty-feed">
                <Search size={25} className="text-[#9aa19d]" />
                <h2 className="mt-4 font-display text-xl text-[#303632]">No signals found</h2>
                <p className="mt-1 text-[13px] text-[#858c87]">Try another source or clear search.</p>
                <button className="mt-4 rounded-md bg-[#292f2c] px-3 py-2 text-[12px] font-semibold text-white" onClick={resetFilters}>Reset filters</button>
              </div>
            )}
          </div>
        </section>

        <aside className="hidden bg-[#f8f9f6] px-6 py-7 xl:sticky xl:top-0 xl:block xl:h-screen xl:overflow-y-auto xl:overscroll-contain" data-testid="feed-right-sidebar">
          <label className="flex h-9 items-center gap-2 rounded-md border border-[#e2e4df] bg-white px-2.5 text-[#a0a6a2] shadow-sm">
            <Search size={17} />
            <input className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#444] outline-none placeholder:text-[#9da39f]" value={filters.query} onChange={(event) => updateFilters({ query: event.target.value })} placeholder="Search your feed" aria-label="Search your feed" type="search" />
            <kbd className="rounded border border-[#dde0dc] bg-[#f8f9f7] px-1 py-0.5 font-mono text-[9px] text-[#9aa19d]">⌘ K</kbd>
          </label>

          <section className="mt-7 border-t border-[#e4e6e1] pt-5">
            <div className="flex items-center justify-between"><h2 className="font-display text-[15px] text-[#2c322f]">Live sources</h2><button className="text-[10px] font-semibold text-[#dc694b]" onClick={() => void refresh()}>Refresh all</button></div>
            <div className="mt-3 space-y-1.5">
              {feed?.statuses.slice().sort((a, b) => tierIndexOf(a.source) - tierIndexOf(b.source)).map((status) => { const score = sourceAvgScore.get(status.source) ?? 0; return (<div key={status.source} className="flex items-center gap-2 rounded px-1 py-1 text-[11px] text-[#59615c]"><span className={`h-1.5 w-1.5 rounded-full ${status.loaded ? "bg-[#67aa72]" : "bg-[#d99157]"}`} /><span className="flex-1">{sourceMeta[status.source].label}</span>{score > 0 && <span className="font-mono text-[9px] text-[#d76346]">{score.toFixed(1)}</span>}<span className="font-mono text-[9px] text-[#a1a7a2]">{status.loaded ? "LIVE" : "WAIT"}</span></div>); })}
            </div>
          </section>

          <section className="mt-6 border-t border-[#e4e6e1] pt-5">
            <div className="flex items-center justify-between"><h2 className="font-display text-[15px] text-[#2c322f]">Focus areas</h2><button className="text-[10px] font-semibold text-[#dc694b]" onClick={() => updateFilters({ query: "" })}>Clear</button></div>
            <div className="mt-3 space-y-1">
              {["AI research", "SOTA technology", "Business growth", "Global compliance", "Vietnam regulation", "US technology policy", "Social administration"].map((topic) => <button key={topic} className="flex w-full items-center justify-between border-b border-[#e9eae5] py-2 text-left text-[12px] font-medium text-[#3b413e] hover:text-[#dd694b]" onClick={() => updateFilters({ query: topic })}>{topic}<Plus size={14} className="text-[#a2a8a4]" /></button>)}
            </div>
          </section>
          <p className="mt-7 text-[10px] leading-5 text-[#a1a7a2]">Live public content. Source links always open at origin.<br />Personal Signal © 2026</p>
        </aside>
      </div>

      <label className="mobile-search fixed left-3 right-3 z-10 flex h-12 items-center gap-2 rounded-lg border border-[#e0e3de] bg-white px-3 shadow-lg sm:bottom-5 sm:left-5 sm:right-5 xl:hidden lg:left-auto lg:right-5 lg:w-[290px]">
        <Search size={17} className="text-[#8f9792]" />
        <input className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9da39f]" value={filters.query} onChange={(event) => updateFilters({ query: event.target.value })} placeholder="Search your feed" aria-label="Search your feed" type="search" />
      </label>

      {toast && (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-md bg-[#262d29] px-3.5 py-2.5 text-[12px] font-medium text-white shadow-xl xl:bottom-5" role="status" aria-live="polite">
          {toast.kind === "warning" ? <CircleAlert size={16} className="text-[#f0bf78]" /> : <Check size={16} className="text-[#83d59e]" />} {toast.message}
        </div>
      )}
    </main>
  );
}
