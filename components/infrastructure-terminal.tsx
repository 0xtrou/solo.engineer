"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  Globe2,
  Landmark,
  Menu,
  Power,
  RefreshCw,
  ServerCog,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { fetchTerminal } from "@/lib/client/terminal-api";
import {
  isTerminalRegion,
  terminalRegionIds,
  type TerminalArticle,
  type TerminalCategory,
  type TerminalFeedResponse,
  type TerminalRegionId,
  type TerminalSourceStatus,
  getTerminalSourceStatuses,
} from "@/lib/terminal-feed";

type InfrastructureTerminalProps = {
  initialFeed?: TerminalFeedResponse;
};

const regionLabels: Record<TerminalRegionId, string> = {
  us: "United States",
  vietnam: "Vietnam",
  china: "China",
};

const regionNotes: Record<TerminalRegionId, string> = {
  us: "Federal energy, semiconductor, monetary-policy and export-control records.",
  vietnam: "Government, power-system, energy-policy and strategic-technology records.",
  china: "National energy, industrial, development-planning and policy records.",
};

const categoryOrder: TerminalCategory[] = ["Power & grid", "Policy & controls", "Hardware & compute", "Capital & costs", "Technology & research"];

function categorySlug(category: TerminalCategory): string {
  return category.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseCategory(value: string | null): TerminalCategory | "all" {
  return categoryOrder.find((category) => categorySlug(category) === value) ?? "all";
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
}

function formatArticleDate(value: string | undefined): string {
  if (!value) return "Date not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not provided";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function uniqueBy<T>(values: T[], getKey: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = getKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCategoryIcon(category: TerminalCategory) {
  if (category === "Power & grid") return Power;
  if (category === "Policy & controls") return Landmark;
  if (category === "Hardware & compute") return ServerCog;
  return Activity;
}

function SourceState({ status }: { status: TerminalSourceStatus }) {
  return (
    <a
      className="terminal-source-state"
      data-testid={`terminal-source-${status.sourceId}`}
      href={status.homepage}
      target="_blank"
      rel="noreferrer"
      title={status.loaded ? `Open ${status.name}` : `${status.name}: ${status.message ?? "unavailable"}`}
    >
      <span className={status.loaded ? "terminal-status-dot terminal-status-dot-live" : "terminal-status-dot terminal-status-dot-error"} aria-hidden="true" />
      <span className="min-w-0 truncate">{status.name}</span>
      <span className="font-mono text-[10px] text-[#7d8b9c]">{status.loaded ? status.itemCount : "ERR"}</span>
    </a>
  );
}

function ArticleRow({ article }: { article: TerminalArticle }) {
  return (
    <article className="terminal-article" data-testid="terminal-article" data-category={categorySlug(article.category)}>
      <div className="terminal-article-rail" aria-hidden="true" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-[0.08em] text-[#8090a3]">
          <span className="text-[#60d7a5]">{article.category.toUpperCase()}</span>
          <span>·</span>
          <span>{article.sourceName.toUpperCase()}</span>
          <span>·</span>
          <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
        </div>
        <a className="mt-2 block text-[15px] font-semibold leading-6 text-[#e8eef5] transition hover:text-[#82e6bc] sm:text-[16px]" href={article.url} target="_blank" rel="noreferrer">
          {article.title}
          <ExternalLink className="ml-2 inline-block -translate-y-px" size={14} aria-hidden="true" />
        </a>
        {article.summary && <p className="mt-2 max-w-4xl text-[13px] leading-5 text-[#a3b0c1]">{article.summary}</p>}
      </div>
    </article>
  );
}

export function InfrastructureTerminal({ initialFeed }: InfrastructureTerminalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const regionParam = searchParams.get("region");
  const selectedRegion: TerminalRegionId = isTerminalRegion(regionParam) ? regionParam : "us";
  const selectedCategory = parseCategory(searchParams.get("sector"));

  const terminalQuery = useQuery<TerminalFeedResponse>({
    queryKey: ["terminal-feed", { region: selectedRegion, category: selectedCategory }],
    queryFn: ({ signal }) => fetchTerminal({ region: selectedRegion, category: selectedCategory === "all" ? "all" : categorySlug(selectedCategory) }, signal),
    initialData: initialFeed,
    placeholderData: (previous) => previous,
    refetchInterval: 300_000,
    refetchOnWindowFocus: false,
  });

  const feed = terminalQuery.data;
  const updateSearch = useCallback((updates: { region?: TerminalRegionId; category?: TerminalCategory | "all" }) => {
    const next = new URLSearchParams(searchParams.toString());
    const region = updates.region ?? selectedRegion;
    const category = updates.category ?? selectedCategory;

    if (region === "us") next.delete("region");
    else next.set("region", region);

    if (category === "all") next.delete("sector");
    else next.set("sector", categorySlug(category));

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setMobileMenuOpen(false);
  }, [pathname, router, searchParams, selectedCategory, selectedRegion]);

  const regionalItems = useMemo(() => feed?.items.filter((item) => item.region === selectedRegion) ?? [], [feed, selectedRegion]);
  const regionalStatuses = useMemo(() => (feed?.statuses ?? getTerminalSourceStatuses()).filter((status) => status.region === selectedRegion), [feed, selectedRegion]);
  const visibleItems = useMemo(() => selectedCategory === "all" ? regionalItems : regionalItems.filter((item) => item.category === selectedCategory), [regionalItems, selectedCategory]);
  const sources = useMemo(() => uniqueBy(regionalStatuses, (status) => status.sourceId), [regionalStatuses]);
  const liveSourceCount = sources.filter((source) => source.loaded).length;
  const hasVisibleData = visibleItems.length > 0;

  return (
    <main className="terminal-shell min-h-screen bg-[#071018] text-[#dfe7f0]" data-testid="terminal-shell">
      <header className="border-b border-[#203040] bg-[#09131d]">
        <div className="mx-auto flex min-h-[58px] max-w-[1680px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5 text-[#edf4fa]" aria-label="Return to Signal home">
            <span className="terminal-mark" aria-hidden="true"><i /><i /><i /></span>
            <span className="truncate font-mono text-[11px] font-medium tracking-[0.16em]">SIGNAL / INFRASTRUCTURE</span>
          </Link>
          <span className="hidden h-4 w-px bg-[#314252] sm:block" />
          <span className="hidden font-mono text-[10px] tracking-[0.12em] text-[#8291a2] sm:block">PRIMARY-SOURCE MONITOR</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded border border-[#294052] bg-[#0c1a26] px-2.5 py-1.5 font-mono text-[10px] text-[#a4b5c7] md:flex">
              <span className="terminal-status-dot terminal-status-dot-live" />
              {liveSourceCount}/{sources.length} SOURCES FETCHED
            </span>
            <button className="terminal-icon-button" onClick={() => void terminalQuery.refetch()} disabled={terminalQuery.isFetching} aria-label="Refresh source records">
              <RefreshCw size={15} className={terminalQuery.isFetching ? "animate-spin" : ""} />
            </button>
            <button className="terminal-icon-button lg:hidden" onClick={() => setMobileMenuOpen((current) => !current)} aria-label="Toggle terminal menu" aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] grid-cols-1 lg:grid-cols-[252px_minmax(0,1fr)]">
        <aside className={`${mobileMenuOpen ? "block" : "hidden"} border-b border-[#203040] bg-[#08121b] px-4 py-5 lg:block lg:min-h-[calc(100vh-58px)] lg:border-b-0 lg:border-r lg:px-5`}>
          <p className="terminal-label">REGION</p>
          <nav className="mt-2 space-y-1" aria-label="Infrastructure regions">
            {terminalRegionIds.map((region) => (
              <button key={region} className={`terminal-nav-button ${selectedRegion === region ? "terminal-nav-button-active" : ""}`} onClick={() => updateSearch({ region })} data-testid={`terminal-region-${region}`}>
                <Globe2 size={15} />
                <span>{regionLabels[region]}</span>
                {region === "us" && <span className="ml-auto font-mono text-[9px] tracking-[0.1em] text-[#64dca8]">DEFAULT</span>}
              </button>
            ))}
          </nav>

          <div className="mt-7 border-t border-[#203040] pt-6">
            <p className="terminal-label">SECTOR</p>
            <nav className="mt-2 space-y-1" aria-label="Infrastructure sectors">
              <button className={`terminal-nav-button ${selectedCategory === "all" ? "terminal-nav-button-active" : ""}`} onClick={() => updateSearch({ category: "all" })} data-testid="terminal-sector-all">
                <Activity size={15} /> All live records
              </button>
              {categoryOrder.map((category) => {
                const Icon = getCategoryIcon(category);
                const count = regionalItems.filter((item) => item.category === category).length;
                return (
                  <button key={category} className={`terminal-nav-button ${selectedCategory === category ? "terminal-nav-button-active" : ""}`} onClick={() => updateSearch({ category })} data-testid={`terminal-sector-${categorySlug(category)}`}>
                    <Icon size={15} />
                    <span className="min-w-0 truncate">{category}</span>
                    <span className="ml-auto font-mono text-[10px] text-[#75879a]">{count}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-7 border-t border-[#203040] pt-6">
            <p className="terminal-label">INGESTION</p>
            <div className="mt-2 space-y-1.5">
              {sources.map((source) => <SourceState key={source.sourceId} status={source} />)}
            </div>
          </div>

          <div className="mt-7 border-t border-[#203040] pt-5 text-[11px] leading-5 text-[#718295]">
            <p className="font-mono tracking-[0.08em] text-[#a1b1c0]">READING RULE</p>
            <p className="mt-2">Headlines and excerpts originate with listed source records. An adapter failure remains visible; this page does not substitute generated content.</p>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-5 border-b border-[#203040] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="terminal-label">{selectedRegion.toUpperCase()} / LIVE RECORDS</p>
              <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.045em] text-[#edf4fa] sm:text-[38px]">{regionLabels[selectedRegion]} AI infrastructure</h1>
              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[#9dafc1]">{regionNotes[selectedRegion]}</p>
            </div>
            <div className="flex min-w-[220px] items-center justify-between gap-4 border border-[#263b4d] bg-[#0a1722] px-4 py-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#8496a8]">LAST SOURCE FETCH</p>
                <p className="mt-1 font-mono text-[11px] text-[#c4d1dc]" data-testid="terminal-fetched-at">{feed ? formatTimestamp(feed.fetchedAt) : "Loading"}</p>
              </div>
              {terminalQuery.isError ? <CircleAlert className="text-[#ff8f75]" size={18} /> : <Check className="text-[#62daa7]" size={18} />}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Live coverage counts">
            {categoryOrder.map((category) => {
              const Icon = getCategoryIcon(category);
              const count = regionalItems.filter((item) => item.category === category).length;
              return (
                <button key={category} className={`terminal-metric ${selectedCategory === category ? "terminal-metric-active" : ""}`} onClick={() => updateSearch({ category })}>
                  <Icon size={15} aria-hidden="true" />
                  <span className="font-mono text-[20px] text-[#edf4fa]">{count}</span>
                  <span className="min-w-0 truncate text-left text-[11px] text-[#9fb0c2]">{category}</span>
                  <ChevronDown className="ml-auto rotate-[-90deg] text-[#64778a]" size={14} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section className="border border-[#223547] bg-[#09141e]" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#203040] px-4 py-3.5 sm:px-5">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.12em] text-[#7e90a2]">{selectedCategory === "all" ? "LATEST VERIFIED RECORDS" : `${selectedCategory.toUpperCase()} RECORDS`}</p>
                  <p className="mt-1 text-[12px] text-[#a4b2c1]">{visibleItems.length} records from {liveSourceCount} live regional adapters.</p>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] text-[#66dba8]"><span className="terminal-status-dot terminal-status-dot-live" /> LIVE</span>
              </div>
              {hasVisibleData ? (
                <div className="divide-y divide-[#1d3040]">
                  {visibleItems.map((article) => <ArticleRow key={article.id} article={article} />)}
                </div>
              ) : (
                <div className="px-5 py-14 text-center" data-testid="terminal-empty">
                  <CircleAlert className="mx-auto text-[#ff9278]" size={22} />
                  <h2 className="mt-4 text-[15px] font-semibold text-[#e4ecf4]">No matching live source records</h2>
                  <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-[#8fa1b3]">This region and sector have no successfully parsed source records at this fetch. Check source status or refresh; no substitute content is shown.</p>
                </div>
              )}
            </section>

            <aside className="space-y-5">
              <section className="border border-[#223547] bg-[#09141e] p-4">
                <p className="terminal-label">SOURCE HEALTH</p>
                <div className="mt-4 space-y-3">
                  {sources.map((source) => (
                    <div key={source.sourceId} className="border-b border-[#1e3040] pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-2">
                        {source.loaded ? <Check className="mt-0.5 shrink-0 text-[#60d7a5]" size={14} /> : <CircleAlert className="mt-0.5 shrink-0 text-[#ff9179]" size={14} />}
                        <div className="min-w-0">
                          <a className="block text-[12px] font-medium leading-5 text-[#dbe5ef] hover:text-[#7be3b7]" href={source.homepage} target="_blank" rel="noreferrer">{source.name}</a>
                          <p className="mt-0.5 font-mono text-[10px] leading-4 text-[#788b9e]">{source.loaded ? source.message ?? `${source.itemCount} LIVE RECORD${source.itemCount === 1 ? "" : "S"}` : source.message ?? "UNAVAILABLE"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border border-[#223547] bg-[#09141e] p-4">
                <p className="terminal-label">DATA DISCIPLINE</p>
                <ul className="mt-4 space-y-3 text-[12px] leading-5 text-[#9bacbd]">
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5bd7a1]" />Primary government, regulator, utility, and public-agency records only.</li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5bd7a1]" />Upstream records cache for up to five minutes; refresh requests the latest available server response.</li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5bd7a1]" />Items link to source pages. Interpret policy and legal records with qualified local advice.</li>
                </ul>
              </section>

              <Link href="/" className="group flex items-center justify-between border border-[#2a465b] bg-[#0b1b27] px-4 py-3 text-[12px] font-medium text-[#bfd0df] transition hover:border-[#4b7c72] hover:text-[#7fe5bb]">
                Return to research reader <ArrowUpRight size={15} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
