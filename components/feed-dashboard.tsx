"use client";

import {
  ArrowDown,
  ArrowUp,
  Bookmark,
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
  Plus,
  Radio,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
  Users,
  Building2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sourceMeta } from "@/lib/source-meta";
import type { FeedItem, FeedResponse, SourceId } from "@/lib/types";

type FeedDashboardProps = { initialFeed: FeedResponse };
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
  mastodon: Radio,
  bluesky: Leaf,
  hashnode: Hash,
  discord: MessageCircle,
};

const researchSourceIds: SourceId[] = [
  "arxiv",
  "hacker-news",
  "github",
  "stack-overflow",
  "dev",
  "indie-hackers",
  "bluesky",
];

const policySourceIds: SourceId[] = ["eu-regulation", "us-regulation", "vietnam-regulation", "world-bank"];

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
    <article className="border-b border-[#ebece7] py-5 first:pt-4">
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

export function FeedDashboard({ initialFeed }: FeedDashboardProps) {
  const [feed, setFeed] = useState<FeedResponse>(initialFeed);
  const [activeSource, setActiveSource] = useState<SourceId | "all">("all");
  const [activeTab, setActiveTab] = useState<"focused" | "research" | "policy">("focused");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [showSaved, setShowSaved] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const notify = useCallback((message: string, kind: ToastKind = "success") => {
    setToast({ message, kind });
  }, []);

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

  const refresh = useCallback(async (sources: SourceId | "all" = activeSource) => {
    setIsRefreshing(true);
    try {
      const params = sources === "all" ? "all" : sources;
      const response = await fetch(`/api/feed?sources=${encodeURIComponent(params)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Feed request failed");
      const nextFeed = (await response.json()) as FeedResponse;
      setFeed(nextFeed);
      const unavailable = nextFeed.statuses.filter((status) => !status.loaded);
      notify(unavailable.length ? `Updated — ${unavailable.length} source${unavailable.length > 1 ? "s" : ""} unavailable` : "Your feed is fresh");
    } catch {
      notify("Could not refresh right now", "warning");
    } finally {
      setIsRefreshing(false);
    }
  }, [activeSource, notify]);

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
    const normalizedQuery = query.trim().toLowerCase();
    let items = feed.items.filter((item) => activeSource === "all" || item.source === activeSource);
    if (activeTab === "research") items = items.filter((item) => researchSourceIds.includes(item.source));
    if (activeTab === "policy") items = items.filter((item) => policySourceIds.includes(item.source));
    if (showSaved) items = items.filter((item) => saved.has(item.id));
    if (normalizedQuery) {
      items = items.filter((item) => `${item.title} ${item.summary} ${item.author} ${item.tag || ""}`.toLowerCase().includes(normalizedQuery));
    }
    if (activeTab === "research") return [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return items;
  }, [activeSource, activeTab, feed.items, query, saved, showSaved]);

  const loadedCount = feed.statuses.filter((status) => status.loaded).length;
  const unavailableStatuses = feed.statuses.filter((status) => !status.loaded);

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#202426]">
      <div className="mx-auto grid min-h-screen max-w-[1480px] grid-cols-1 lg:grid-cols-[236px_minmax(570px,1fr)] xl:grid-cols-[236px_minmax(570px,1fr)_340px]">
        <aside className="hidden min-h-screen border-r border-[#e4e6e1] bg-[#fbfcfa] px-[18px] py-7 lg:flex lg:flex-col">
          <button className="flex items-center gap-2.5 px-3 text-[25px] font-bold tracking-[-1.3px]" onClick={() => { setActiveSource("all"); setShowSaved(false); }}>
            <span className="relative grid h-6 w-6 place-items-center -rotate-12"><i className="absolute h-[7px] w-[7px] -translate-x-1.5 translate-y-1.5 rounded-full bg-[#e8bd4d]" /><i className="absolute h-[7px] w-[7px] translate-x-1.5 translate-y-1.5 rounded-full bg-[#f27252]" /><i className="absolute h-[7px] w-[7px] -translate-y-1.5 rounded-full bg-[#263e52]" /></span>
            <span className="font-display">signal</span>
          </button>

          <nav className="mt-10 space-y-1">
            <button className="nav-item nav-item-active"><Home size={19} /> Home</button>
            <button className="nav-item" onClick={() => notify("Explore is coming next") }><Compass size={19} /> Explore</button>
            <button className={`nav-item ${showSaved ? "nav-item-active" : ""}`} onClick={() => setShowSaved((value) => !value)}><Bookmark size={19} /> Library <span className="ml-auto font-mono text-[10px] font-medium text-[#8e9590]">{saved.size}</span></button>
          </nav>

          <div className="mt-9 flex items-center justify-between px-2.5 font-mono text-[10px] tracking-[.8px] text-[#989f9a]">
            <span>YOUR SOURCES</span>
            <button className="rounded p-0.5 hover:bg-[#edf0ec]" onClick={() => notify("Sources are configured in your local environment") } aria-label="Source settings"><Plus size={16} /></button>
          </div>
          <nav className="mt-2 space-y-1">
            <button className={`source-item ${activeSource === "all" ? "source-item-active" : ""}`} onClick={() => { setActiveSource("all"); setShowSaved(false); }}><Sparkles size={16} /> All sources <span>{feed.items.length}</span></button>
            {researchSourceIds.map((source) => (
              <button key={source} className={`source-item ${activeSource === source ? "source-item-active" : ""}`} onClick={() => { setActiveSource(source); setShowSaved(false); }}>
                <span style={{ color: sourceMeta[source].accent }}><SourceMark source={source} size={16} /></span>{sourceMeta[source].label}
              </button>
            ))}
          </nav>
          <button className="mt-3 flex items-center gap-2 px-2.5 text-[12px] font-semibold text-[#7c847f] hover:text-[#27302b]" onClick={() => notify("Discord and Hashnode need optional local adapters; see .env.example") }><Plus size={16} /> Add local source</button>
          <div className="mt-4 px-2.5 font-mono text-[10px] tracking-[.8px] text-[#989f9a]">POLICY & ECONOMY</div>
          <nav className="mt-2 space-y-1">
            {policySourceIds.map((source) => (
              <button key={source} className={`source-item ${activeSource === source ? "source-item-active" : ""}`} onClick={() => { setActiveSource(source); setShowSaved(false); }}>
                <span style={{ color: sourceMeta[source].accent }}><SourceMark source={source} size={16} /></span>{sourceMeta[source].label}
              </button>
            ))}
          </nav>
          <p className="mt-auto px-2.5 text-[10px] leading-5 text-[#9ba19c]">Professional personal reader<br />No account or tracking.</p>
        </aside>

        <section className="min-w-0 bg-[#fffdfb] px-5 sm:px-9 lg:px-11">
          <header className="flex h-[58px] items-center justify-between border-b border-[#e7e8e2] lg:hidden">
            <span className="font-display text-xl font-bold tracking-tight">signal</span>
            <button className="rounded-md p-2 text-[#6c746f] hover:bg-[#f0f1ed]" onClick={() => refresh()} aria-label="Refresh feed"><RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} /></button>
          </header>
          <div className="flex items-start justify-between gap-4 pb-6 pt-10 sm:pt-11">
            <div>
              <p className="font-mono text-[10px] font-medium tracking-[.95px] text-[#8f9792]">PERSONAL WEB READER</p>
              <h1 className="mt-2 font-display text-[29px] font-semibold tracking-[-1.1px] text-[#222725] sm:text-[31px]">Worth your attention <span className="font-sans text-[20px] text-[#e7af4a]">✦</span></h1>
              <p className="mt-1.5 text-[13px] text-[#818883]">{loadedCount} live sources for research, technology, policy, and growth.</p>
            </div>
            <button className="mt-1 hidden items-center gap-1.5 rounded-md border border-[#dedfd9] bg-[#fffefa] px-2.5 py-1.5 text-[11px] font-medium text-[#717975] shadow-sm hover:border-[#cfd2cc] sm:flex" onClick={() => refresh()} disabled={isRefreshing}>
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> {isRefreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>

          <div className="flex h-11 items-center justify-between border-b border-[#e6e6e0]">
            <nav className="flex h-full gap-6">
              {([ ["focused", "Focused"], ["research", "Research & AI"], ["policy", "Policy & economy"] ] as const).map(([id, label]) => (
                <button key={id} className={`tab-button ${activeTab === id ? "tab-button-active" : ""}`} onClick={() => setActiveTab(id)}>{label}</button>
              ))}
            </nav>
            <button className="flex items-center gap-1.5 text-[11px] font-semibold text-[#818984] hover:text-[#3d4540]" onClick={() => notify("Use research, policy, and source filters to tune your feed") }><ChevronDown size={15} /> Tune</button>
          </div>

          {unavailableStatuses.length > 0 && (
            <div className="mt-4 flex gap-2 rounded-md border border-[#f0dfc9] bg-[#fff7eb] px-3 py-2 text-[11px] leading-4 text-[#856644]">
              <CircleAlert size={15} className="mt-0.5 shrink-0" />
              <span>{unavailableStatuses.map((status) => sourceMeta[status.source].label).join(", ")} unavailable right now. Other live sources remain in your feed.</span>
            </div>
          )}

          <div className="pb-10">
            {visibleItems.map((item) => <FeedCard key={item.id} item={item} saved={saved.has(item.id)} upvoted={upvoted.has(item.id)} onToggleSave={toggleSave} onToggleVote={toggleVote} />)}
            {visibleItems.length === 0 && (
              <div className="grid place-items-center py-24 text-center">
                <Search size={25} className="text-[#9aa19d]" />
                <h2 className="mt-4 font-display text-xl text-[#303632]">No signals found</h2>
                <p className="mt-1 text-[13px] text-[#858c87]">Try another source or clear search.</p>
                <button className="mt-4 rounded-md bg-[#292f2c] px-3 py-2 text-[12px] font-semibold text-white" onClick={() => { setQuery(""); setActiveSource("all"); setShowSaved(false); }}>Reset filters</button>
              </div>
            )}
          </div>
        </section>

        <aside className="hidden bg-[#f8f9f6] px-6 py-7 xl:block">
          <label className="flex h-9 items-center gap-2 rounded-md border border-[#e2e4df] bg-white px-2.5 text-[#a0a6a2] shadow-sm">
            <Search size={17} />
            <input className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#444] outline-none placeholder:text-[#9da39f]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your feed" />
            <kbd className="rounded border border-[#dde0dc] bg-[#f8f9f7] px-1 py-0.5 font-mono text-[9px] text-[#9aa19d]">⌘ K</kbd>
          </label>

          <section className="mt-7 border-t border-[#e4e6e1] pt-5">
            <div className="flex items-center justify-between"><h2 className="font-display text-[15px] text-[#2c322f]">Live sources</h2><button className="text-[10px] font-semibold text-[#dc694b]" onClick={() => refresh()}>Refresh all</button></div>
            <div className="mt-3 space-y-1.5">
              {feed.statuses.map((status) => <div key={status.source} className="flex items-center gap-2 rounded px-1 py-1 text-[11px] text-[#59615c]"><span className={`h-1.5 w-1.5 rounded-full ${status.loaded ? "bg-[#67aa72]" : "bg-[#d99157]"}`} /><span className="flex-1">{sourceMeta[status.source].label}</span><span className="font-mono text-[9px] text-[#a1a7a2]">{status.loaded ? "LIVE" : "WAIT"}</span></div>)}</div>
          </section>

          <section className="mt-6 border-t border-[#e4e6e1] pt-5">
            <div className="flex items-center justify-between"><h2 className="font-display text-[15px] text-[#2c322f]">Focus areas</h2><button className="text-[10px] font-semibold text-[#dc694b]" onClick={() => setQuery("")}>Clear</button></div>
            <div className="mt-3 space-y-1">
              {["AI research", "SOTA technology", "Business growth", "Global compliance", "Vietnam regulation", "US technology policy", "Social administration"].map((topic) => <button key={topic} className="flex w-full items-center justify-between border-b border-[#e9eae5] py-2 text-left text-[12px] font-medium text-[#3b413e] hover:text-[#dd694b]" onClick={() => setQuery(topic)}>{topic}<Plus size={14} className="text-[#a2a8a4]" /></button>)}
            </div>
          </section>
          <p className="mt-7 text-[10px] leading-5 text-[#a1a7a2]">Live public content. Source links always open at origin.<br />Personal Signal © 2026</p>
        </aside>
      </div>

      <label className="fixed bottom-5 left-5 right-5 z-10 flex h-11 items-center gap-2 rounded-lg border border-[#e0e3de] bg-white px-3 shadow-lg xl:hidden lg:left-auto lg:right-5 lg:w-[290px]">
        <Search size={17} className="text-[#8f9792]" />
        <input className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9da39f]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your feed" />
      </label>

      {toast && (
        <div className="fixed bottom-[74px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-md bg-[#262d29] px-3.5 py-2.5 text-[12px] font-medium text-white shadow-xl xl:bottom-5">
          {toast.kind === "warning" ? <CircleAlert size={16} className="text-[#f0bf78]" /> : <Check size={16} className="text-[#83d59e]" />} {toast.message}
        </div>
      )}
    </main>
  );
}
