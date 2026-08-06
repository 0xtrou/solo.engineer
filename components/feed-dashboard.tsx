"use client";

import {
  Bell,
  Bookmark,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  Database,
  ExternalLink,
  Filter,
  Grid2X2,
  Landmark,
  Menu,
  Network,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { sourceMeta } from "@/lib/source-meta";
import type { FeedItem, FeedResponse, SourceId } from "@/lib/types";

type FeedDashboardProps = { initialFeed: FeedResponse };
type CountryKey = "us" | "vietnam" | "china";
type Tone = "cyan" | "lime" | "orange" | "violet" | "blue";
type SignalCategory = "POWER" | "POLICY" | "HARDWARE" | "LAND" | "CAPITAL" | "NETWORK" | "RESEARCH";

type Metric = {
  label: string;
  value: string;
  unit: string;
  change: string;
  direction: "up" | "down" | "flat";
  note: string;
  tone: Tone;
};

type Signal = FeedItem & {
  category: SignalCategory;
  impact: "High" | "Med" | "Watch";
  tags: string[];
};

type CountryData = {
  key: CountryKey;
  name: string;
  flag: string;
  focus: string;
  pulse: string;
  note: string;
  prioritySources: SourceId[];
  gridNodes: { name: string; x: number; y: number; size: number; status: string; tone: Tone }[];
};

const filters = ["All signals", "Power", "Policy", "Hardware", "Land & build", "Capital", "Research"];

const countries: Record<CountryKey, CountryData> = {
  us: {
    key: "us",
    name: "United States",
    flag: "US",
    focus: "North America / AI compute",
    pulse: "Source coverage weighted toward US policy, research, and market signals.",
    note: "US policy connector available; broader coverage remains global.",
    prioritySources: ["us-regulation", "world-bank", "arxiv", "openalex"],
    gridNodes: [
      { name: "US POLICY", x: 73, y: 47, size: 15, status: "LIVE", tone: "orange" },
      { name: "MACRO", x: 47, y: 64, size: 11, status: "LIVE", tone: "lime" },
      { name: "RESEARCH", x: 27, y: 59, size: 9, status: "LIVE", tone: "violet" },
      { name: "DEV SOURCES", x: 62, y: 44, size: 8, status: "LIVE", tone: "orange" },
      { name: "SOCIAL", x: 63, y: 63, size: 10, status: "LIVE", tone: "cyan" },
    ],
  },
  vietnam: {
    key: "vietnam",
    name: "Vietnam",
    flag: "VN",
    focus: "Southeast Asia / emerging compute",
    pulse: "Source coverage weighted toward Vietnam policy, macro, and infrastructure signals.",
    note: "Vietnam legal connector available; infrastructure signals are sourced globally.",
    prioritySources: ["vietnam-regulation", "world-bank", "arxiv", "openalex"],
    gridNodes: [
      { name: "VN POLICY", x: 55, y: 25, size: 12, status: "LIVE", tone: "cyan" },
      { name: "MACRO", x: 64, y: 31, size: 9, status: "LIVE", tone: "violet" },
      { name: "RESEARCH", x: 45, y: 52, size: 7, status: "LIVE", tone: "lime" },
      { name: "DEV SOURCES", x: 38, y: 76, size: 15, status: "LIVE", tone: "orange" },
      { name: "SOCIAL", x: 29, y: 84, size: 7, status: "LIVE", tone: "lime" },
    ],
  },
  china: {
    key: "china",
    name: "China",
    flag: "CN",
    focus: "Greater China / sovereign compute",
    pulse: "Source coverage weighted toward global AI research, macro, and open-model signals.",
    note: "No China-specific connector exists in current backend; lens uses shared sources.",
    prioritySources: ["world-bank", "openalex", "hugging-face", "google-ai"],
    gridNodes: [
      { name: "MACRO", x: 66, y: 30, size: 13, status: "LIVE", tone: "orange" },
      { name: "OPEN MODELS", x: 75, y: 55, size: 14, status: "LIVE", tone: "cyan" },
      { name: "RESEARCH", x: 53, y: 62, size: 11, status: "LIVE", tone: "lime" },
      { name: "AI SOURCES", x: 43, y: 39, size: 12, status: "LIVE", tone: "cyan" },
      { name: "DEV SOURCES", x: 67, y: 72, size: 9, status: "LIVE", tone: "violet" },
    ],
  },
};

const categoryTerms: Record<SignalCategory, string[]> = {
  POWER: ["power", "grid", "energy", "electric", "utility", "transmission", "interconnect", "cooling", "water"],
  POLICY: ["policy", "regulation", "regulatory", "law", "compliance", "government", "federal", "act", "administration", "public sector"],
  HARDWARE: ["gpu", "chip", "accelerator", "semiconductor", "nvidia", "hardware", "model", "inference", "compute", "cluster"],
  LAND: ["land", "site", "campus", "construction", "permit", "building", "real estate", "warehouse", "facility"],
  CAPITAL: ["capital", "funding", "investment", "investor", "rate", "yield", "economy", "business", "financing", "startup"],
  NETWORK: ["network", "fiber", "cable", "latency", "telecom", "internet", "carrier", "connectivity"],
  RESEARCH: ["research", "paper", "science", "academic", "study", "developer", "engineering", "technology"],
};

function searchableText(item: FeedItem) {
  return `${item.title} ${item.summary} ${item.tag ?? ""} ${sourceMeta[item.source].label}`.toLowerCase();
}

function inferCategory(item: FeedItem): SignalCategory {
  if (["eu-regulation", "us-regulation", "vietnam-regulation"].includes(item.source)) return "POLICY";
  const text = searchableText(item);
  const ranked = (Object.keys(categoryTerms) as SignalCategory[]).map((category) => ({ category, hits: categoryTerms[category].filter((term) => text.includes(term)).length })).sort((left, right) => right.hits - left.hits);
  return ranked[0]?.hits ? ranked[0].category : "RESEARCH";
}

function inferImpact(item: FeedItem): Signal["impact"] {
  if (item.source.includes("regulation") || (item.score ?? 0) >= 85) return "High";
  if ((item.score ?? 0) >= 35 || (item.comments ?? 0) >= 10) return "Med";
  return "Watch";
}

function toSignal(item: FeedItem): Signal {
  const category = inferCategory(item);
  const sourceLabel = sourceMeta[item.source].label;
  return {
    ...item,
    category,
    impact: inferImpact(item),
    tags: [...new Set([item.tag, category, sourceLabel].filter(Boolean) as string[])].slice(0, 3),
  };
}

function toDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  const difference = Date.now() - date.getTime();
  if (difference < 60_000) return "now";
  if (difference < 3_600_000) return `${Math.max(1, Math.round(difference / 60_000))}m`;
  if (difference < 86_400_000) return `${Math.max(1, Math.round(difference / 3_600_000))}h`;
  if (difference < 604_800_000) return `${Math.max(1, Math.round(difference / 86_400_000))}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function countryCode(country: CountryKey) {
  return country === "us" ? "US" : country === "vietnam" ? "VN" : "CN";
}

function linePoints(values: number[], width: number, height: number, minimum: number, maximum: number, top = 8, bottom = 11) {
  const range = Math.max(maximum - minimum, 1);
  return values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = top + (1 - (value - minimum) / range) * (height - top - bottom);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function buildChart(items: Signal[]) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - 11 + index, 1));
  const signalCounts = months.map((month) => items.filter((item) => { const date = new Date(item.publishedAt); return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth(); }).length);
  const policyCounts = months.map((month) => items.filter((item) => { const date = new Date(item.publishedAt); return item.category === "POLICY" && date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth(); }).length);
  const maximum = Math.max(...signalCounts, ...policyCounts, 1);
  return { signalCounts, policyCounts, maximum, labels: months.map((month) => month.toLocaleDateString(undefined, { month: "short" })) };
}

function LogoMark() {
  return <span className="logo-mark" aria-hidden="true"><i /><i /><i /></span>;
}

function MetricCard({ metric }: { metric: Metric }) {
  const arrow = metric.direction === "up" ? "↑" : metric.direction === "down" ? "↓" : "•";
  return <article className={`metric-card tone-${metric.tone}`}><div className="metric-topline"><span>{metric.label}</span><span className="metric-live-dot" /></div><div className="metric-value-row"><strong>{metric.value}</strong><span>{metric.unit}</span></div><div className={`metric-change ${metric.direction}`}><span>{arrow} {metric.change}</span><small>{metric.note}</small></div></article>;
}

function CapacityChart({ chart }: { chart: ReturnType<typeof buildChart> }) {
  const signalPoints = linePoints(chart.signalCounts, 600, 202, 0, chart.maximum);
  const policyPoints = linePoints(chart.policyCounts, 600, 202, 0, chart.maximum);
  const areaPoints = `0,202 ${signalPoints} 600,202`;
  const lastSignalY = signalPoints.split(" ").at(-1)?.split(",")[1] ?? "202";
  const lastPolicyY = policyPoints.split(" ").at(-1)?.split(",")[1] ?? "202";
  return <div className="chart-wrap"><svg className="capacity-chart" viewBox="0 0 600 226" role="img" aria-label="Twelve month live signal and policy coverage chart"><defs><linearGradient id="demand-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#59d7f2" stopOpacity="0.28" /><stop offset="100%" stopColor="#59d7f2" stopOpacity="0" /></linearGradient></defs>{[24, 70, 116, 162, 202].map((y) => <line key={y} x1="0" y1={y} x2="600" y2={y} className="chart-gridline" />)}{[150, 300, 450].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="202" className="chart-gridline vertical" />)}<polygon points={areaPoints} fill="url(#demand-fill)" /><polyline points={policyPoints} className="chart-line capacity" /><polyline points={signalPoints} className="chart-line demand" /><circle cx="600" cy={lastSignalY} r="4.5" className="chart-dot-demand" /><circle cx="600" cy={lastPolicyY} r="4.5" className="chart-dot-capacity" />{chart.labels.map((label, index) => <text key={`${label}-${index}`} x={(index / Math.max(chart.labels.length - 1, 1)) * 600} y="220" textAnchor={index === 0 ? "start" : index === chart.labels.length - 1 ? "end" : "middle"} className="chart-label">{label}</text>)}</svg><span className="axis-value top">{chart.maximum}</span><span className="axis-value bottom">0</span></div>;
}

function RegionMap({ data }: { data: CountryData }) {
  return <div className="region-map" role="img" aria-label={`${data.name} source coverage map`}><div className={`map-contour ${data.key}`} /><span className="map-ring ring-one" /><span className="map-ring ring-two" /><span className="map-ring ring-three" />{data.gridNodes.map((node) => <div className={`map-node tone-${node.tone}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} key={node.name}><span className="node-pulse" style={{ width: node.size, height: node.size }} /><div className="node-label"><strong>{node.name}</strong><small>{node.status}</small></div></div>)}<div className="map-scale"><span>0</span><i /><span>300 km</span></div></div>;
}

export function InfrastructureDashboard({ initialFeed }: FeedDashboardProps) {
  const [activeCountry, setActiveCountry] = useState<CountryKey>("us");
  const [activeFilter, setActiveFilter] = useState("All signals");
  const [activeSource, setActiveSource] = useState<SourceId | "all">("all");
  const [selectedArticle, setSelectedArticle] = useState(0);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [leftRailOpen, setLeftRailOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const hasLoadedSaved = useRef(false);
  const country = countries[activeCountry];
  const feedQuery = useQuery({ queryKey: ["infra-feed"], queryFn: async () => { const response = await fetch("/api/feed?sources=all", { cache: "no-store" }); if (!response.ok) throw new Error("Feed request failed"); return response.json() as Promise<FeedResponse>; }, initialData: initialFeed, staleTime: 300_000 });
  const feed = feedQuery.data ?? initialFeed;
  const signals = useMemo(() => feed.items.map(toSignal).sort((left, right) => { const leftPriority = country.prioritySources.includes(left.source) ? 1 : 0; const rightPriority = country.prioritySources.includes(right.source) ? 1 : 0; return rightPriority - leftPriority || Date.parse(right.publishedAt) - Date.parse(left.publishedAt); }), [country.prioritySources, feed.items]);
  const articles = useMemo(() => signals.filter((article) => { const categoryMatches = activeFilter === "All signals" || (activeFilter === "Land & build" && ["LAND", "NETWORK"].includes(article.category)) || (activeFilter === "Capital" && article.category === "CAPITAL") || article.category === activeFilter.toUpperCase(); const sourceMatches = activeSource === "all" || article.source === activeSource; const searchMatches = searchableText(article).includes(query.toLowerCase()); return categoryMatches && sourceMatches && searchMatches; }), [activeFilter, activeSource, query, signals]);
  const activeArticle = articles[Math.min(selectedArticle, Math.max(articles.length - 1, 0))] ?? articles[0] ?? signals[0];
  const chart = useMemo(() => buildChart(signals), [signals]);
  const loadedSources = feed.statuses.filter((status) => status.loaded).length;
  const metrics: Metric[] = [
    { label: "Live sources", value: `${loadedSources}`, unit: `/${feed.statuses.length}`, change: feedQuery.isFetching ? "refreshing" : "live", direction: "flat", note: "adapter status", tone: "cyan" },
    { label: "Signals indexed", value: `${signals.length}`, unit: "items", change: `${toDateLabel(feed.fetchedAt)}`, direction: "flat", note: "current cycle", tone: "lime" },
    { label: "Policy coverage", value: `${signals.filter((item) => item.category === "POLICY").length}`, unit: "items", change: `${Math.round((signals.filter((item) => item.category === "POLICY").length / Math.max(signals.length, 1)) * 100)}%`, direction: "flat", note: "policy sources", tone: "orange" },
    { label: "AI / hardware", value: `${signals.filter((item) => ["HARDWARE", "RESEARCH"].includes(item.category)).length}`, unit: "items", change: "ranked", direction: "flat", note: "research sources", tone: "violet" },
    { label: "Freshest signal", value: signals[0] ? toDateLabel(signals[0].publishedAt) : "—", unit: "ago", change: "latest", direction: "flat", note: signals[0] ? sourceMeta[signals[0].source].label : "no data", tone: "blue" },
    { label: "Saved signals", value: `${saved.length}`, unit: "stories", change: "local", direction: "flat", note: "this browser", tone: "cyan" },
  ];

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem("infrapulse-saved-signals");
      if (stored) setSaved(JSON.parse(stored) as string[]);
      hasLoadedSaved.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (hasLoadedSaved.current) window.localStorage.setItem("infrapulse-saved-signals", JSON.stringify(saved));
  }, [saved]);

  const refresh = useCallback(() => { void feedQuery.refetch(); }, [feedQuery]);
  const toggleSaved = (id: string) => setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const dateLabel = new Date(feed.fetchedAt).toLocaleString(undefined, { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return <main className="terminal-shell" data-country={activeCountry}><aside className={`left-rail ${leftRailOpen ? "open" : ""}`}><div className="rail-brand"><LogoMark /><span>INFRA<br />PULSE</span></div><nav className="rail-nav" aria-label="Primary navigation"><button className="rail-action active" aria-label="Intelligence desk"><Grid2X2 size={18} /></button><button className="rail-action" aria-label="Infrastructure network"><Network size={18} /></button><button className="rail-action" aria-label="Asset database"><Database size={18} /></button><button className="rail-action" aria-label="Policy monitor"><Landmark size={18} /></button></nav><div className="rail-bottom"><button className="rail-action" aria-label="Settings"><Settings2 size={17} /></button><button className="rail-profile" aria-label="User profile"><CircleUserRound size={20} /></button></div></aside><section className="terminal-content"><header className="topbar"><div className="topbar-title"><button className="mobile-menu" onClick={() => setLeftRailOpen((open) => !open)} aria-label="Toggle navigation"><Menu size={19} /></button><span className="eyebrow">INTELLIGENCE / AI INFRASTRUCTURE</span><span className="separator" /><span className="topbar-region">{country.focus}</span></div><div className="topbar-tools"><button className={`status-pill ${notifications ? "enabled" : ""}`} onClick={() => { setNotifications((enabled) => !enabled); refresh(); }}><i /> {feedQuery.isFetching ? "Refreshing" : notifications ? "Live signals" : "Signals paused"}</button><button className="icon-button" aria-label="Refresh feed" onClick={refresh}><RefreshCw size={17} className={feedQuery.isFetching ? "spin" : ""} /></button><button className="icon-button" aria-label="Notifications"><Bell size={17} /></button><button className="profile-chip">KR <ChevronDown size={13} /></button></div></header><section className="country-switcher" aria-label="Country selection"><div className="country-switcher-label"><span className="live-needle" />MARKET LENS</div>{(Object.keys(countries) as CountryKey[]).map((key) => <button className={`country-tab ${activeCountry === key ? "active" : ""}`} onClick={() => { setActiveCountry(key); setSelectedArticle(0); setActiveFilter("All signals"); setActiveSource("all"); }} key={key}><span className={`flag flag-${key}`}>{countryCode(key)}</span>{countries[key].name}</button>)}<button className="compare-button">Compare <Plus size={14} /></button></section><div className="dashboard-body"><section className="main-column"><section className="masthead"><div><div className="overline"><span className="location-mark" />{country.name} / LIVE INTELLIGENCE</div><h1>AI infrastructure<br /><em>in motion.</em></h1><p>{country.pulse}</p><span className="source-note">{country.note}</span></div><div className="masthead-figure"><div className="signal-score"><span>INFRA PULSE</span><strong>{Math.min(10, Math.max(1, Math.round((loadedSources / Math.max(feed.statuses.length, 1)) * 10) * 0.1 + 7)).toFixed(1)}</strong><small>/ 10</small><div><i style={{ width: `${Math.round((loadedSources / Math.max(feed.statuses.length, 1)) * 100)}%` }} /></div></div><div className="signal-brief"><span>MARKET REGIME</span><strong>{feedQuery.error ? "Refresh required" : "Source-connected"}</strong><small>{signals.length} ranked signals · {loadedSources}/{feed.statuses.length} adapters live</small></div></div></section><section className="metric-grid" aria-label="Key infrastructure metrics">{metrics.map((metric) => <MetricCard metric={metric} key={metric.label} />)}</section><section className="panel capacity-panel"><div className="panel-head"><div><span className="panel-kicker">SIGNAL ACTIVITY</span><h2>Live coverage vs. policy mix</h2></div><div className="chart-legend"><span><i className="legend-line demand" />All signals</span><span><i className="legend-line capacity" />Policy + economy</span><button>12M <ChevronDown size={13} /></button></div></div><div className="chart-area"><div className="y-caption">ITEMS / MONTH</div><CapacityChart chart={chart} /></div><div className="panel-footer"><span><Database size={14} /> Current source set includes <strong>{feed.statuses.length} adapters</strong></span><button onClick={refresh}>Refresh source set <ChevronRight size={14} /></button></div></section><section className="news-section"><div className="news-head"><div><span className="panel-kicker">SIGNAL STREAM</span><h2>What moves the build</h2></div><div className="feed-controls"><div className="filter-wrap"><Filter size={14} /><select aria-label="Filter signals" value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setSelectedArticle(0); }}>{filters.map((filter) => <option key={filter}>{filter}</option>)}</select></div><div className="filter-wrap"><Database size={14} /><select aria-label="Filter sources" value={activeSource} onChange={(event) => { setActiveSource(event.target.value as SourceId | "all"); setSelectedArticle(0); }}><option value="all">All sources</option>{feed.statuses.map((status) => <option value={status.source} key={status.source}>{sourceMeta[status.source].label}</option>)}</select></div><label className="feed-search"><Search size={14} /><input aria-label="Search signals" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedArticle(0); }} placeholder="Search signals" /></label></div></div><div className="news-table">{articles.length > 0 ? articles.map((article, index) => { const isSaved = saved.includes(article.id); return <article className={`news-row ${activeArticle?.id === article.id ? "selected" : ""}`} key={article.id} onClick={() => setSelectedArticle(index)}><time>{toDateLabel(article.publishedAt)}</time><div className="news-source"><i style={{ background: sourceMeta[article.source].accent }} />{sourceMeta[article.source].label}</div><div className="news-copy"><div><span className={`impact ${article.impact.toLowerCase()}`}>{article.impact}</span><h3>{article.title}</h3></div><p>{article.summary}</p></div><button className={`bookmark ${isSaved ? "saved" : ""}`} aria-label="Save story" onClick={(event) => { event.stopPropagation(); toggleSaved(article.id); }}><Bookmark size={16} fill={isSaved ? "currentColor" : "none"} /></button></article>; }) : <div className="empty-results"><Search size={18} /><strong>No matching signals</strong><span>Try another topic or clear search.</span><button onClick={() => { setQuery(""); setActiveFilter("All signals"); setActiveSource("all"); }}>Reset filters</button></div>}</div></section></section><aside className="right-column"><section className="panel detail-panel"><div className="panel-head compact"><span className="panel-kicker">SIGNAL DETAIL</span><button className="detail-close" onClick={() => setSelectedArticle(0)} aria-label="Reset story"><X size={15} /></button></div>{activeArticle ? <><span className={`impact ${activeArticle.impact.toLowerCase()}`}>{activeArticle.impact} IMPACT</span><h2>{activeArticle.title}</h2><p>{activeArticle.summary}</p><div className="story-tags">{activeArticle.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="detail-footer"><span><i style={{ background: sourceMeta[activeArticle.source].accent }} />{sourceMeta[activeArticle.source].label} · {toDateLabel(activeArticle.publishedAt)}</span><a href={activeArticle.url} target="_blank" rel="noreferrer" aria-label="Open source"><ExternalLink size={15} /></a></div></> : <div className="empty-results"><Search size={18} /><strong>No signal detail</strong></div>}</section><section className="panel map-panel"><div className="panel-head compact"><div><span className="panel-kicker">SOURCE COVERAGE</span><h2>Regional lens</h2></div><button className="map-control">Grid view <ChevronDown size={12} /></button></div><RegionMap data={country} /><div className="map-legend"><span><i className="legend-dot cyan" />Active</span><span><i className="legend-dot lime" />Open</span><span><i className="legend-dot orange" />Priority</span></div></section><section className="panel watchlist-panel"><div className="panel-head compact"><div><span className="panel-kicker">MARKET TAPE</span><h2>Coverage watch</h2></div><button className="plain-action">{loadedSources}/{feed.statuses.length} live</button></div><div className="watchlist-table">{feed.statuses.slice(0, 6).map((status) => <div className="watch-row" key={status.source}><div><strong>{sourceMeta[status.source].label}</strong><span>{status.loaded ? "Adapter responding" : status.message ?? "Unavailable"}</span></div><span>{feed.items.filter((item) => item.source === status.source).length}</span><em className={status.loaded ? "down" : "up"}>{status.loaded ? "LIVE" : "WAIT"}</em></div>)}</div></section><section className="panel events-panel"><div className="panel-head compact"><div><span className="panel-kicker">CYCLE INFO</span><h2>Data provenance</h2></div><button className="plain-action">{feedQuery.isFetching ? "Refreshing" : "Cached 5m"}</button></div><div className="event-row"><time>NOW</time><i className="event-dot tone-cyan" /><div><strong>{feed.items.length} ranked signals</strong><span>Fetched {dateLabel}</span></div></div><div className="event-row"><time>API</time><i className="event-dot tone-lime" /><div><strong>/api/feed?sources=all</strong><span>Existing source adapter route</span></div></div></section></aside></div><footer className="terminal-footer"><div><span className="pulse-dot" /> SIGNAL DESK · LIVE SOURCE DATA</div><div>Last cycle <strong>{dateLabel}</strong> <span className="footer-divider" /> {feed.statuses.length} source adapters monitored <span className="footer-divider" /> <CircleHelp size={13} /> Methodology</div></footer></section></main>;
}
