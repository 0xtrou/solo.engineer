"use client";

import { useQuery } from "@tanstack/react-query";
import { CryptoCategoryScores } from "@/components/crypto-category-scores";
import { citationInDegree, computeSourceQuality } from "@/lib/source-quality";
import { cryptoSourceDomains } from "@/lib/source-domains";
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  Coins,
  ExternalLink,
  Layers,
  Link2,
  Menu,
  RefreshCw,
  Rocket,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { fetchCrypto } from "@/lib/client/crypto-api";
import {
  type CryptoArticle,
  type CryptoCategory,
  cryptoRegionIds,
  type CryptoFeedResponse,
  type CryptoRegionId,
  type CryptoSourceStatus,
  type CryptoSourceTier,
  getCryptoSourceStatuses,
  isCryptoRegion,
} from "@/lib/crypto-feed";

type CryptoTerminalProps = {
  initialFeed?: CryptoFeedResponse;
};

const regionLabels: Record<CryptoRegionId, string> = {
  launches: "Launches",
  layer1: "Layer 1",
  layer2: "Layer 2",
  defi: "DeFi",
  markets: "Markets",
};

const regionNotes: Record<CryptoRegionId, string> = {
  launches: "Token launches, airdrops, TGEs, mainnet activations, and listings tracked from BitcoinTalk, Airdrops.io, and CoinGecko trending.",
  layer1: "Base-layer protocol records — consensus, upgrades, validators, forks across Solana, Sui, Sei, and emerging L1 chains.",
  layer2: "Rollup and scaling records — optimistic, ZK, sequencer, and bridge updates from Blast and emerging L2 chains.",
  defi: "TVL, liquidity, lending, DEX, and yield-protocol records from DeFiLlama on-chain data.",
  markets: "Price, volume, market cap, ETF flows, and derivatives coverage from CoinDesk, CoinTelegraph, and CoinGecko.",
};

const categoryOrder: CryptoCategory[] = ["Launches & TGE", "Layer 1", "Layer 2", "DeFi", "Markets"];

function categorySlug(category: CryptoCategory): string {
  return category.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function tierColor(tier: CryptoSourceTier): string {
  switch (tier) {
    case "T1 wire":
      return "#60d7a5";
    case "T2 trade":
      return "#73aefa";
    case "T3 community":
      return "#ff9179";
  }
}

function cryptoTierRankForStatus(status: { tier?: CryptoSourceTier }): number {
  switch (status.tier) {
    case "T1 wire":
      return 0;
    case "T2 trade":
      return 1;
    case "T3 community":
      return 2;
    default:
      return 3;
  }
}

function parseCategory(value: string | null): CryptoCategory | "all" {
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

function formatPrice(value: number): string {
  if (value >= 1000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(6)}`;
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

function getCategoryIcon(category: CryptoCategory) {
  if (category === "Launches & TGE") return Rocket;
  if (category === "Layer 1") return Layers;
  if (category === "Layer 2") return Link2;
  if (category === "DeFi") return Coins;
  return TrendingUp;
}

function SourceState({ status, composite }: { status: CryptoSourceStatus; composite?: number }) {
  return (
    <a
      className="terminal-source-state"
      data-testid={`crypto-source-${status.sourceId}`}
      href={status.homepage}
      target="_blank"
      rel="noreferrer"
      title={status.loaded ? `Open ${status.name} · Q${composite ?? 0}` : `${status.name}: ${status.message ?? "unavailable"}`}
    >
      <span className={status.loaded ? "terminal-status-dot terminal-status-dot-live" : "terminal-status-dot terminal-status-dot-error"} aria-hidden="true" />
      <span className="min-w-0 truncate">{status.name}</span>
      {composite !== undefined && <span className="font-mono text-[10px] text-[#64dca8]">{composite}</span>}
      <span className="font-mono text-[10px] text-[#7d8b9c]">{status.loaded ? status.itemCount : "ERR"}</span>
    </a>
  );
}

function ArticleRow({ article }: { article: CryptoArticle }) {
  return (
    <article className="terminal-article" data-testid="crypto-article" data-category={categorySlug(article.category)}>
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
        {article.categoryScores && (
          <div className="mt-2">
            <CryptoCategoryScores scores={article.categoryScores} testId="crypto-category-scores" activeColor="#60d7a5" mutedColor="#5f7080" />
          </div>
        )}
      </div>
    </article>
  );
}

type ActivityPoint = { label: string; count: number };

function ActivityChart({ points }: { points: ActivityPoint[] }) {
  const width = 360;
  const height = 96;
  const padding = { top: 10, right: 8, bottom: 22, left: 8 };
  const maximum = Math.max(...points.map((point) => point.count), 1);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const plotPoints = points.map((point, index) => {
    const x = padding.left + (chartWidth * index) / Math.max(points.length - 1, 1);
    const y = padding.top + chartHeight - (point.count / maximum) * chartHeight;
    return { ...point, x, y };
  });
  const line = plotPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const area = plotPoints.length
    ? `M ${plotPoints[0].x} ${height - padding.bottom} L ${plotPoints.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${plotPoints.at(-1)?.x} ${height - padding.bottom} Z`
    : "";

  return (
    <div className="mt-4" data-testid="crypto-activity-chart">
      <svg className="h-[116px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Seven-day record cadence">
        {[0, 0.5, 1].map((ratio) => {
          const y = padding.top + chartHeight * ratio;
          return <line key={ratio} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#223a4d" strokeDasharray="3 4" />;
        })}
        {area && <path d={area} fill="rgba(99, 220, 167, 0.13)" />}
        {line && <polyline points={line} fill="none" stroke="#67dca8" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
        {plotPoints.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="2.5" fill="#9af0ca" vectorEffect="non-scaling-stroke" />)}
        {plotPoints.map((point, index) => (
          <text key={point.label} x={point.x} y={height - 5} textAnchor={index === 0 ? "start" : index === plotPoints.length - 1 ? "end" : "middle"} fill="#71869a" fontSize="8">{point.label}</text>
        ))}
      </svg>
    </div>
  );
}

export function CryptoTerminal({ initialFeed }: CryptoTerminalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const regionParam = searchParams.get("region");
  const selectedRegion: CryptoRegionId = isCryptoRegion(regionParam) ? regionParam : "launches";
  const selectedCategory = parseCategory(searchParams.get("sector"));
  const searchQuery = searchParams.get("q") ?? "";

  const cryptoQuery = useQuery<CryptoFeedResponse>({
    queryKey: ["crypto-feed"],
    queryFn: ({ signal }) => fetchCrypto(signal),
    initialData: initialFeed,
    placeholderData: (previous) => previous,
    refetchInterval: 300_000,
    refetchOnWindowFocus: false,
  });

  const feed = cryptoQuery.data;
  const updateSearch = useCallback((updates: { region?: CryptoRegionId; category?: CryptoCategory | "all"; query?: string }) => {
    const next = new URLSearchParams(searchParams.toString());
    const region = updates.region ?? selectedRegion;
    const category = updates.category ?? selectedCategory;
    const query = updates.query ?? searchQuery;

    if (region === "launches") next.delete("region");
    else next.set("region", region);

    if (category === "all") next.delete("sector");
    else next.set("sector", categorySlug(category));

    if (query) next.set("q", query);
    else next.delete("q");

    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    if (updates.region || updates.category) setMobileMenuOpen(false);
  }, [pathname, router, searchParams, selectedCategory, selectedRegion, searchQuery]);

  const regionalItems = useMemo(() => feed?.items.filter((item) => item.region === selectedRegion) ?? [], [feed, selectedRegion]);
  const regionalStatuses = useMemo(() => (feed?.statuses ?? getCryptoSourceStatuses()).filter((status) => status.region === selectedRegion), [feed, selectedRegion]);
  const visibleItems = useMemo(() => {
    const byCategory = selectedCategory === "all" ? regionalItems : regionalItems.filter((item) => item.category === selectedCategory);
    if (!searchQuery.trim()) return byCategory;
    const needle = searchQuery.trim().toLowerCase();
    return byCategory.filter((item) => `${item.title} ${item.summary ?? ""} ${item.sourceName}`.toLowerCase().includes(needle));
  }, [regionalItems, selectedCategory, searchQuery]);
  const sourceQuality = useMemo(() => {
    const citations = citationInDegree(regionalItems, cryptoSourceDomains, (i) => i.sourceId);
    return computeSourceQuality(regionalItems, {
      sourceKey: (i) => i.sourceId,
      tierFor: (sourceId) => regionalStatuses.find((s) => s.sourceId === sourceId)?.tier,
      citationMap: citations,
    });
  }, [regionalItems, regionalStatuses]);
  const sources = useMemo(() =>
    uniqueBy(regionalStatuses, (status) => status.sourceId)
      .map((source, index) => ({ source, index }))
      .sort((left, right) => {
        const compositeDiff = (sourceQuality.get(right.source.sourceId)?.composite ?? 0) - (sourceQuality.get(left.source.sourceId)?.composite ?? 0);
        if (compositeDiff !== 0) return compositeDiff;
        return cryptoTierRankForStatus(left.source) - cryptoTierRankForStatus(right.source) || left.index - right.index;
      })
      .map((entry) => entry.source),
  [regionalStatuses, sourceQuality]);
  const liveSourceCount = sources.filter((source) => source.loaded).length;
  const hasVisibleData = visibleItems.length > 0;
  const categoryCounts = useMemo(() => new Map(categoryOrder.map((category) => [category, regionalItems.filter((item) => item.category === category).length])), [regionalItems]);
  const maxCategoryCount = Math.max(...categoryOrder.map((category) => categoryCounts.get(category) ?? 0), 1);
  const sourceCapture = useMemo(() => {
    const byCount = new Map<string, number>();
    for (const item of visibleItems) byCount.set(item.sourceId, (byCount.get(item.sourceId) ?? 0) + 1);
    return sources.map((source) => ({
      ...source,
      count: byCount.get(source.sourceId) ?? 0,
    })).sort((left, right) => {
      const compositeDiff = (sourceQuality.get(right.sourceId)?.composite ?? 0) - (sourceQuality.get(left.sourceId)?.composite ?? 0);
      if (compositeDiff !== 0) return compositeDiff;
      return cryptoTierRankForStatus(left) - cryptoTierRankForStatus(right)
        || right.count - left.count
        || left.name.localeCompare(right.name);
    });
  }, [sources, visibleItems, sourceQuality]);
  const maxSourceCount = Math.max(...sourceCapture.map((source) => source.count), 1);
  const activityPoints = useMemo<ActivityPoint[]>(() => {
    const timestamps = visibleItems.flatMap((item) => item.publishedAt ? [Date.parse(item.publishedAt)] : []).filter((value) => Number.isFinite(value));
    if (!timestamps.length) {
      return Array.from({ length: 7 }, (_, index) => ({ label: index === 6 ? "Now" : `D-${6 - index}`, count: 0 }));
    }

    const latest = Math.max(...timestamps);
    const dayMs = 24 * 60 * 60 * 1_000;

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(latest - (6 - index) * dayMs);
      const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      const end = start + dayMs;
      return {
        label: new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", timeZone: "UTC" }).format(date),
        count: timestamps.filter((timestamp) => timestamp >= start && timestamp < end).length,
      };
    });
  }, [visibleItems]);

  return (
    <main className="crypto-shell terminal-shell min-h-screen bg-[#071018] text-[#dfe7f0]" data-testid="crypto-shell">
      <header className="border-b border-[#203040] bg-[#09131d]">
        <div className="mx-auto flex min-h-[58px] max-w-[1680px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5 text-[#edf4fa]" aria-label="Return to Signal home">
            <span className="terminal-mark" aria-hidden="true"><i /><i /><i /></span>
            <span className="truncate font-mono text-[11px] font-medium tracking-[0.16em]">SIGNAL / CRYPTO</span>
          </Link>
          <span className="hidden h-4 w-px bg-[#314252] sm:block" />
          <span className="hidden font-mono text-[10px] tracking-[0.12em] text-[#8291a2] sm:block">LAUNCHES · L1 · L2 · DEFI · MARKETS</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded border border-[#294052] bg-[#0c1a26] px-2.5 py-1.5 font-mono text-[10px] text-[#a4b5c7] md:flex">
              <span className="terminal-status-dot terminal-status-dot-live" />
              {liveSourceCount}/{sources.length} SOURCES FETCHED
            </span>
            <button className="terminal-icon-button" onClick={() => void cryptoQuery.refetch()} disabled={cryptoQuery.isFetching} aria-label="Refresh source records">
              <RefreshCw size={15} className={cryptoQuery.isFetching ? "animate-spin" : ""} />
            </button>
            <button className="terminal-icon-button lg:hidden" onClick={() => setMobileMenuOpen((current) => !current)} aria-label="Toggle terminal menu" aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] grid-cols-1 lg:items-start lg:grid-cols-[252px_minmax(0,1fr)]">
        <aside className={`${mobileMenuOpen ? "block" : "hidden"} border-b border-[#203040] bg-[#08121b] px-4 py-5 lg:sticky lg:top-[58px] lg:block lg:h-[calc(100vh-58px)] lg:overflow-y-auto lg:overscroll-contain lg:border-b-0 lg:border-r lg:px-5`} data-testid="crypto-left-sidebar">
          <p className="terminal-label">SECTOR</p>
          <nav className="mt-2 space-y-1" aria-label="Crypto sectors">
            {cryptoRegionIds.map((region) => (
              <button key={region} className={`terminal-nav-button ${selectedRegion === region ? "terminal-nav-button-active" : ""}`} onClick={() => updateSearch({ region })} data-testid={`crypto-region-${region}`}>
                {region === "launches" ? <Rocket size={15} /> : region === "layer1" ? <Layers size={15} /> : region === "layer2" ? <Link2 size={15} /> : region === "defi" ? <Coins size={15} /> : <TrendingUp size={15} />}
                <span>{regionLabels[region]}</span>
                {region === "launches" && <span className="ml-auto font-mono text-[9px] tracking-[0.1em] text-[#64dca8]">DEFAULT</span>}
              </button>
            ))}
          </nav>

          <div className="mt-7 border-t border-[#203040] pt-6">
            <p className="terminal-label">CATEGORY</p>
            <nav className="mt-2 space-y-1" aria-label="Crypto categories">
              <button className={`terminal-nav-button ${selectedCategory === "all" ? "terminal-nav-button-active" : ""}`} onClick={() => updateSearch({ category: "all" })} data-testid="crypto-sector-all">
                <Activity size={15} /> All live records
              </button>
              {categoryOrder.map((category) => {
                const Icon = getCategoryIcon(category);
                const count = regionalItems.filter((item) => item.category === category).length;
                return (
                  <button key={category} className={`terminal-nav-button ${selectedCategory === category ? "terminal-nav-button-active" : ""}`} onClick={() => updateSearch({ category })} data-testid={`crypto-sector-${categorySlug(category)}`}>
                    <Icon size={15} />
                    <span className="min-w-0 truncate">{category}</span>
                    <span className="ml-auto font-mono text-[10px] text-[#75879a]">{count}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-7 border-t border-[#203040] pt-6">
            <p className="terminal-label">SEARCH RECORDS</p>
            <label className="mt-2 flex h-9 items-center gap-2 rounded border border-[#223547] bg-[#0b1b27] px-2.5 text-[#7d8b9c] focus-within:border-[#3a5a72]">
              <Search size={15} className="shrink-0 text-[#5f7080]" />
              <input
                className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#cfe0ee] outline-none placeholder:text-[#4a5b6d]"
                value={searchQuery}
                onChange={(event) => updateSearch({ query: event.target.value })}
                placeholder="Filter by title, source, keyword"
                aria-label="Filter crypto records"
                type="search"
              />
              {searchQuery && (
                <button className="shrink-0 text-[#5f7080] hover:text-[#cfe0ee]" onClick={() => updateSearch({ query: "" })} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </label>
          </div>

          <div className="mt-7 border-t border-[#203040] pt-6">
            <p className="terminal-label">INGESTION</p>
            <div className="mt-2 space-y-1.5">
              {sources.map((source) => <SourceState key={source.sourceId} status={source} composite={sourceQuality.get(source.sourceId)?.composite} />)}
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
              <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.045em] text-[#edf4fa] sm:text-[38px]">{regionLabels[selectedRegion]} crypto</h1>
              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[#9dafc1]">{regionNotes[selectedRegion]}</p>
            </div>
            <div className="flex min-w-[220px] items-center justify-between gap-4 border border-[#263b4d] bg-[#0a1722] px-4 py-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#8496a8]">LAST SOURCE FETCH</p>
                <p className="mt-1 font-mono text-[11px] text-[#c4d1dc]" data-testid="crypto-fetched-at">{feed ? formatTimestamp(feed.fetchedAt) : "Loading"}</p>
              </div>
              {cryptoQuery.isError ? <CircleAlert className="text-[#ff8f75]" size={18} /> : <Check className="text-[#62daa7]" size={18} />}
            </div>
          </div>

          {feed?.prices && feed.prices.length > 0 && (
            <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Live price tiles" data-testid="crypto-price-tiles">
              {feed.prices.map((coin) => {
                const positive = coin.change24h >= 0;
                return (
                  <a key={coin.id} href={`https://www.coingecko.com/en/coins/${coin.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-[#223547] bg-[#09141e] px-3 py-2 transition hover:border-[#3a5a72]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coin.image} alt="" className="h-5 w-5 rounded-full" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[11px] font-semibold text-[#dbe5ef]">{coin.symbol}</p>
                      <p className="font-mono text-[12px] text-[#c4d1dc]">{formatPrice(coin.priceUsd)}</p>
                    </div>
                    <span className="font-mono text-[10px]" style={{ color: positive ? "#60d7a5" : "#ff8f75" }}>{positive ? "+" : ""}{coin.change24h.toFixed(1)}%</span>
                  </a>
                );
              })}
            </div>
          )}

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

          <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,.9fr)_minmax(250px,.85fr)]" aria-label="Live telemetry" data-testid="crypto-telemetry">
            <section className="border border-[#223547] bg-[#09141e] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="terminal-label">RECORD CADENCE</p>
                  <p className="mt-1 text-[12px] text-[#9fb0c2]">Published records across latest seven source days.</p>
                </div>
                <span className="font-mono text-[18px] text-[#e9f3fa]">{visibleItems.length}</span>
              </div>
              <ActivityChart points={activityPoints} />
            </section>

            <section className="border border-[#223547] bg-[#09141e] p-4 sm:p-5" data-testid="crypto-category-chart">
              <p className="terminal-label">CATEGORY MIX</p>
              <p className="mt-1 text-[12px] text-[#9fb0c2]">Visible records by category.</p>
              <div className="mt-4 space-y-3">
                {categoryOrder.map((category) => {
                  const count = categoryCounts.get(category) ?? 0;
                  return (
                    <button key={category} className="block w-full text-left" onClick={() => updateSearch({ category })} aria-label={`Filter to ${category}: ${count} records`}>
                      <span className="flex items-center justify-between gap-3 text-[11px] text-[#b5c4d1]"><span className="truncate">{category}</span><span className="font-mono text-[#dce8f1]">{count}</span></span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden bg-[#172b3b]"><span className="block h-full bg-[#64dca8] transition-[width] duration-300" style={{ width: `${(count / maxCategoryCount) * 100}%` }} /></span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="border border-[#223547] bg-[#09141e] p-4 sm:p-5" data-testid="crypto-source-chart">
              <p className="terminal-label">SOURCE CAPTURE</p>
              <p className="mt-1 text-[12px] text-[#9fb0c2]">Records from live sector adapters.</p>
              <div className="mt-4 space-y-3">
                {sourceCapture.length ? sourceCapture.map((source) => {
                  const q = sourceQuality.get(source.sourceId);
                  const composite = q?.composite ?? 0;
                  return (
                  <div key={source.sourceId} title={q ? `Q${composite} · ${Math.round(q.yieldPct)}% yield · ${q.citations} cites` : source.name}>
                    <span className="flex items-center justify-between gap-3 text-[11px] text-[#b5c4d1]"><span className="flex min-w-0 items-center gap-1.5 truncate"><span className={source.loaded ? "terminal-status-dot terminal-status-dot-live" : "terminal-status-dot terminal-status-dot-error"} />{source.name}</span><span className="flex items-center gap-1.5 font-mono text-[#dce8f1]"><span className="text-[#64dca8]">{composite}</span><span>{source.count}</span></span></span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden bg-[#172b3b]"><span className={source.loaded ? "block h-full bg-[#73aefa] transition-[width] duration-300" : "block h-full bg-[#ff9079] transition-[width] duration-300"} style={{ width: `${(source.count / maxSourceCount) * 100}%` }} /></span>
                  </div>
                  );
                }) : <p className="text-[12px] leading-5 text-[#7e92a4]">Waiting for source records.</p>}
              </div>
            </section>
          </section>

          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <section className="border border-[#223547] bg-[#09141e]" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#203040] px-4 py-3.5 sm:px-5">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.12em] text-[#7e90a2]">{selectedCategory === "all" ? "LATEST VERIFIED RECORDS" : `${selectedCategory.toUpperCase()} RECORDS`}</p>
                  <p className="mt-1 text-[12px] text-[#a4b2c1]">{visibleItems.length} records from {liveSourceCount} live sector adapters.</p>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] text-[#66dba8]"><span className="terminal-status-dot terminal-status-dot-live" /> LIVE</span>
              </div>
              {hasVisibleData ? (
                <div className="divide-y divide-[#1d3040]">
                  {visibleItems.map((article) => <ArticleRow key={article.id} article={article} />)}
                </div>
              ) : (
                <div className="px-5 py-14 text-center" data-testid="crypto-empty">
                  <CircleAlert className="mx-auto text-[#ff9178]" size={22} />
                  <h2 className="mt-4 text-[15px] font-semibold text-[#e4ecf4]">No matching live source records</h2>
                  <p className="mx-auto mt-2 max-w-md text-[13px] leading-5 text-[#8fa1b3]">This sector and category have no successfully parsed source records at this fetch. Check source status or refresh; no substitute content is shown.</p>
                </div>
              )}
            </section>

            <aside className="space-y-5 xl:sticky xl:top-[78px] xl:max-h-[calc(100vh-98px)] xl:overflow-y-auto xl:overscroll-contain xl:pr-1" data-testid="crypto-right-sidebar">
              <section className="border border-[#223547] bg-[#09141e] p-4">
                <p className="terminal-label">SOURCE HEALTH</p>
                <div className="mt-4 space-y-3">
                  {sources.map((source) => {
                    const q = sourceQuality.get(source.sourceId);
                    const composite = q?.composite ?? 0;
                    return (
                    <div key={source.sourceId} className="border-b border-[#1e3040] pb-3 last:border-b-0 last:pb-0" title={q ? `Q${composite} · ${Math.round(q.yieldPct)}% yield · ${q.citations} cites · ${q.scored}/${q.total} scored` : source.name}>
                      <div className="flex items-start gap-2">
                        {source.loaded ? <Check className="mt-0.5 shrink-0 text-[#60d7a5]" size={14} /> : <CircleAlert className="mt-0.5 shrink-0 text-[#ff9179]" size={14} />}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            <a className="text-[12px] font-medium leading-5 text-[#dbe5ef] hover:text-[#7be3b7]" href={source.homepage} target="_blank" rel="noreferrer">{source.name}</a>
                            {source.tier && (
                              <span
                                className="rounded px-1 py-px font-mono text-[8px] font-semibold uppercase leading-[1.2] tracking-wide"
                                style={{ color: tierColor(source.tier), border: `1px solid ${tierColor(source.tier)}40` }}
                                aria-label={`Reputation tier ${source.tier}`}
                              >
                                {source.tier.split(" ")[0]}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 font-mono text-[10px] leading-4 text-[#788b9e]">{source.loaded ? `${source.message ?? `${source.itemCount} LIVE RECORD${source.itemCount === 1 ? "" : "S"}`} · Q${composite} · ${q ? Math.round(q.yieldPct) : 0}% yield` : source.message ?? "UNAVAILABLE"}</p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>

              <section className="border border-[#223547] bg-[#09141e] p-4">
                <p className="terminal-label">DATA DISCIPLINE</p>
                <ul className="mt-4 space-y-3 text-[12px] leading-5 text-[#9bacbd]">
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5bd7a1]" />Tier-1 wire services, exchange data feeds, and on-chain primary records (DeFiLlama, CoinGecko) only.</li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5bd7a1]" />Upstream records cache for ten minutes; refresh requests the latest available server response.</li>
                  <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5bd7a1]" />Market data is informational, not investment advice. Verify on-chain before transacting.</li>
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
