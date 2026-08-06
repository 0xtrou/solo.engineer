"use client";

import {
  Bell,
  Bolt,
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
  Search,
  Settings2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type CountryKey = "us" | "vietnam" | "china";
type Tone = "cyan" | "lime" | "orange" | "violet" | "blue";

type Metric = {
  label: string;
  value: string;
  unit: string;
  change: string;
  direction: "up" | "down" | "flat";
  note: string;
  tone: Tone;
};

type Article = {
  time: string;
  source: string;
  sourceColor: string;
  category: string;
  title: string;
  summary: string;
  impact: "High" | "Med" | "Watch";
  tags: string[];
};

type WatchItem = {
  code: string;
  label: string;
  value: string;
  change: string;
  direction: "up" | "down";
};

type CountryData = {
  key: CountryKey;
  name: string;
  flag: string;
  focus: string;
  pulse: string;
  date: string;
  location: string;
  metrics: Metric[];
  articles: Article[];
  capacity: { total: string; queued: string; power: string; land: string; projects: string };
  watchlist: WatchItem[];
  events: { date: string; title: string; category: string; tone: Tone }[];
  chart: { demand: number[]; capacity: number[]; labels: string[]; start: string; end: string };
  gridNodes: { name: string; x: number; y: number; size: number; status: string; tone: Tone }[];
};

const countries: Record<CountryKey, CountryData> = {
  us: {
    key: "us",
    name: "United States",
    flag: "US",
    focus: "North America / AI compute",
    pulse: "Power market tightens across primary AI load corridors.",
    date: "Thursday, Aug 06, 2026 · 09:42 ET",
    location: "United States",
    metrics: [
      { label: "Delivered power", value: "$72.40", unit: "/ MWh", change: "+6.8%", direction: "up", note: "PJM peak node", tone: "orange" },
      { label: "Grid-ready capacity", value: "4.6", unit: "GW", change: "−0.3 GW", direction: "down", note: "primary markets", tone: "cyan" },
      { label: "H100 equivalent", value: "$2.31", unit: "/ GPU hr", change: "−4.1%", direction: "down", note: "spot blended", tone: "lime" },
      { label: "Land ask", value: "$186k", unit: "/ usable acre", change: "+12.5%", direction: "up", note: "Virginia cluster", tone: "violet" },
      { label: "10Y treasury", value: "4.18", unit: "%", change: "+9 bp", direction: "up", note: "close", tone: "blue" },
      { label: "DC labor index", value: "132.6", unit: "index", change: "+1.7%", direction: "up", note: "skilled trades", tone: "cyan" },
    ],
    articles: [
      { time: "09:18", source: "GRID WIRE", sourceColor: "#6ee7f9", category: "POWER", title: "PJM advances fast-track path for large-load interconnections", summary: "A proposed queue lane would prioritize projects pairing firm generation or storage with new high-density load.", impact: "High", tags: ["PJM", "Interconnect", "Data centers"] },
      { time: "08:46", source: "POLICY DESK", sourceColor: "#c4b5fd", category: "POLICY", title: "Federal permitting reform puts transmission siting back on the AI build agenda", summary: "Developers are repricing delivery risk as permitting clocks shorten for designated backbone projects.", impact: "High", tags: ["Transmission", "Federal", "Permitting"] },
      { time: "08:11", source: "SILICON WATCH", sourceColor: "#a3e635", category: "HARDWARE", title: "Secondary-market accelerator supply improves in US cloud regions", summary: "Short-duration capacity prices retreat, while latest-gen reservations remain supply constrained.", impact: "Med", tags: ["GPU", "Cloud", "Supply"] },
      { time: "07:39", source: "CAPITAL FLOW", sourceColor: "#fbbf24", category: "MACRO", title: "Higher long-end yields widen financing gap for speculative campuses", summary: "Capital shifts toward pre-leased sites with utility agreements already under contract.", impact: "Med", tags: ["Rates", "Debt", "Development"] },
      { time: "07:04", source: "SITE INTEL", sourceColor: "#fb923c", category: "LAND", title: "Northern Virginia parcel competition moves into adjacent transmission zones", summary: "Land bidders are following substations rather than traditional fiber-led geography.", impact: "Watch", tags: ["Virginia", "Land", "Substations"] },
    ],
    capacity: { total: "26.8 GW", queued: "41.2 GW", power: "$72.40/MWh", land: "$186k/ac", projects: "184" },
    watchlist: [
      { code: "PJM-W", label: "PJM west hub", value: "$69.82", change: "+8.2%", direction: "up" },
      { code: "ERCOT", label: "North hub", value: "$41.90", change: "−2.4%", direction: "down" },
      { code: "VA-LAND", label: "Northern VA land", value: "186.0", change: "+12.5%", direction: "up" },
      { code: "GPU-SPT", label: "GPU spot basket", value: "2.31", change: "−4.1%", direction: "down" },
    ],
    events: [
      { date: "08 AUG", title: "PJM interconnection committee", category: "POWER", tone: "orange" },
      { date: "12 AUG", title: "US CPI / real-rate read-through", category: "MACRO", tone: "blue" },
      { date: "19 AUG", title: "Virginia data center permit hearing", category: "LAND", tone: "violet" },
    ],
    chart: { demand: [24, 26, 29, 31, 34, 38, 43, 48, 54, 61, 68, 76], capacity: [24, 25, 26, 28, 31, 35, 39, 43, 48, 53, 59, 65], labels: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"], start: "24", end: "76" },
    gridNodes: [
      { name: "N. VIRGINIA", x: 73, y: 47, size: 15, status: "TIGHT", tone: "orange" },
      { name: "DALLAS", x: 47, y: 64, size: 11, status: "OPEN", tone: "lime" },
      { name: "PHOENIX", x: 27, y: 59, size: 9, status: "WATCH", tone: "violet" },
      { name: "COLUMBUS", x: 62, y: 44, size: 8, status: "TIGHT", tone: "orange" },
      { name: "ATLANTA", x: 63, y: 63, size: 10, status: "ACTIVE", tone: "cyan" },
    ],
  },
  vietnam: {
    key: "vietnam",
    name: "Vietnam",
    flag: "VN",
    focus: "Southeast Asia / emerging compute",
    pulse: "Fiber-rich hubs gain attention as capacity and policy mature.",
    date: "Thursday, Aug 06, 2026 · 20:42 ICT",
    location: "Vietnam",
    metrics: [
      { label: "Delivered power", value: "$54.10", unit: "/ MWh", change: "+2.9%", direction: "up", note: "HCMC industrial", tone: "orange" },
      { label: "Grid-ready capacity", value: "1.1", unit: "GW", change: "+0.2 GW", direction: "up", note: "priority zones", tone: "cyan" },
      { label: "H100 equivalent", value: "$2.76", unit: "/ GPU hr", change: "−1.8%", direction: "down", note: "regional blend", tone: "lime" },
      { label: "Land ask", value: "$68k", unit: "/ usable acre", change: "+8.4%", direction: "up", note: "HCMC fringe", tone: "violet" },
      { label: "10Y sovereign", value: "3.41", unit: "%", change: "−3 bp", direction: "down", note: "close", tone: "blue" },
      { label: "DC labor index", value: "82.7", unit: "index", change: "+3.2%", direction: "up", note: "electrical trades", tone: "cyan" },
    ],
    articles: [
      { time: "19:54", source: "ENERGY NOTE", sourceColor: "#6ee7f9", category: "POWER", title: "Southern industrial parks move data-center load into power-planning focus", summary: "New high-density demand proposals are linking campus schedules to grid reinforcement and rooftop generation.", impact: "High", tags: ["HCMC", "Industrial parks", "Grid"] },
      { time: "19:21", source: "POLICY DESK", sourceColor: "#c4b5fd", category: "POLICY", title: "Digital infrastructure rules sharpen focus on localization and resilience", summary: "Operators are assessing implications for regional cloud placement and domestic redundancy requirements.", impact: "High", tags: ["Cloud", "Regulation", "Resilience"] },
      { time: "18:40", source: "FIBER TRACK", sourceColor: "#a3e635", category: "NETWORK", title: "Hanoi and HCMC route diversity remains central to new campus underwriting", summary: "Carrier access and cable landing risk are separating sites with otherwise similar power economics.", impact: "Med", tags: ["Fiber", "Hanoi", "HCMC"] },
      { time: "18:02", source: "BUILD COST", sourceColor: "#fbbf24", category: "COST", title: "Specialist MEP demand lifts delivery timelines for larger white-space builds", summary: "Construction teams report higher pressure around generator, switchgear, and commissioning crews.", impact: "Med", tags: ["MEP", "Labor", "Construction"] },
      { time: "17:28", source: "SITE INTEL", sourceColor: "#fb923c", category: "LAND", title: "Bắc Ninh and HCMC edge sites draw new AI infrastructure screening", summary: "Early-stage site activity concentrates around industrial power and metro fiber connectivity.", impact: "Watch", tags: ["Bắc Ninh", "Land", "Site selection"] },
    ],
    capacity: { total: "1.9 GW", queued: "4.8 GW", power: "$54.10/MWh", land: "$68k/ac", projects: "39" },
    watchlist: [
      { code: "HCMC-PWR", label: "South industrial", value: "$54.10", change: "+2.9%", direction: "up" },
      { code: "HN-LAND", label: "Hanoi edge land", value: "73.0", change: "+5.7%", direction: "up" },
      { code: "VN10Y", label: "10Y sovereign", value: "3.41", change: "−0.9%", direction: "down" },
      { code: "GPU-SEA", label: "SEA GPU basket", value: "2.76", change: "−1.8%", direction: "down" },
    ],
    events: [
      { date: "07 AUG", title: "National grid planning briefing", category: "POWER", tone: "orange" },
      { date: "11 AUG", title: "Digital infrastructure policy forum", category: "POLICY", tone: "violet" },
      { date: "22 AUG", title: "HCMC industrial land tender", category: "LAND", tone: "blue" },
    ],
    chart: { demand: [12, 14, 15, 17, 20, 23, 27, 31, 35, 40, 46, 53], capacity: [12, 13, 14, 15, 17, 19, 22, 25, 28, 32, 36, 41], labels: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"], start: "12", end: "53" },
    gridNodes: [
      { name: "HANOI", x: 55, y: 25, size: 12, status: "ACTIVE", tone: "cyan" },
      { name: "BAC NINH", x: 64, y: 31, size: 9, status: "WATCH", tone: "violet" },
      { name: "DA NANG", x: 45, y: 52, size: 7, status: "OPEN", tone: "lime" },
      { name: "HCMC", x: 38, y: 76, size: 15, status: "TIGHT", tone: "orange" },
      { name: "CAN THO", x: 29, y: 84, size: 7, status: "OPEN", tone: "lime" },
    ],
  },
  china: {
    key: "china",
    name: "China",
    flag: "CN",
    focus: "Greater China / sovereign compute",
    pulse: "Compute policy and power allocation steer capacity toward western hubs.",
    date: "Thursday, Aug 06, 2026 · 21:42 CST",
    location: "China",
    metrics: [
      { label: "Delivered power", value: "$47.80", unit: "/ MWh", change: "−1.3%", direction: "down", note: "western hub", tone: "orange" },
      { label: "Grid-ready capacity", value: "9.2", unit: "GW", change: "+0.6 GW", direction: "up", note: "AI corridors", tone: "cyan" },
      { label: "H100 equivalent", value: "$3.64", unit: "/ GPU hr", change: "+5.6%", direction: "up", note: "restricted supply", tone: "lime" },
      { label: "Land ask", value: "$91k", unit: "/ usable acre", change: "+3.1%", direction: "up", note: "western cluster", tone: "violet" },
      { label: "10Y sovereign", value: "1.86", unit: "%", change: "−2 bp", direction: "down", note: "close", tone: "blue" },
      { label: "DC labor index", value: "98.5", unit: "index", change: "+0.8%", direction: "up", note: "technical labor", tone: "cyan" },
    ],
    articles: [
      { time: "20:58", source: "COMPUTE WIRE", sourceColor: "#a3e635", category: "HARDWARE", title: "Domestic accelerator roadmaps keep procurement teams focused on utilization", summary: "Operators prioritize workload fit and rack efficiency as availability differs by chip category and region.", impact: "High", tags: ["Accelerators", "Utilization", "Supply"] },
      { time: "20:15", source: "GRID WIRE", sourceColor: "#6ee7f9", category: "POWER", title: "Western compute hubs gain from coordinated renewable and transmission buildout", summary: "New campus planning favors regions where low-carbon power and network corridors arrive together.", impact: "High", tags: ["Renewables", "Transmission", "West"] },
      { time: "19:47", source: "POLICY DESK", sourceColor: "#c4b5fd", category: "POLICY", title: "Compute allocation guidance elevates efficiency metrics in new cluster approvals", summary: "Project sponsors are modeling power usage effectiveness and utilization alongside headline capacity.", impact: "Med", tags: ["Approvals", "Efficiency", "Policy"] },
      { time: "19:06", source: "CAPITAL FLOW", sourceColor: "#fbbf24", category: "MACRO", title: "Low funding costs support build-to-suit structures for national operators", summary: "Financing conditions favor larger planned campuses when anchor workloads are visible.", impact: "Med", tags: ["Rates", "Financing", "Campuses"] },
      { time: "18:31", source: "SITE INTEL", sourceColor: "#fb923c", category: "LAND", title: "Coastal inference zones and inland training hubs create two-speed site market", summary: "Latency-led demand and power-led demand are separating location requirements for AI fleets.", impact: "Watch", tags: ["Inference", "Training", "Sites"] },
    ],
    capacity: { total: "31.4 GW", queued: "52.6 GW", power: "$47.80/MWh", land: "$91k/ac", projects: "268" },
    watchlist: [
      { code: "NXC-PWR", label: "Ningxia corridor", value: "$47.80", change: "−1.3%", direction: "down" },
      { code: "SH-EDGE", label: "Shanghai edge land", value: "221.0", change: "+8.0%", direction: "up" },
      { code: "CN10Y", label: "10Y sovereign", value: "1.86", change: "−1.1%", direction: "down" },
      { code: "GPU-CN", label: "GPU access basket", value: "3.64", change: "+5.6%", direction: "up" },
    ],
    events: [
      { date: "09 AUG", title: "Western data hub capacity release", category: "POWER", tone: "orange" },
      { date: "14 AUG", title: "Domestic accelerator launch window", category: "HARDWARE", tone: "lime" },
      { date: "25 AUG", title: "Compute efficiency reporting date", category: "POLICY", tone: "violet" },
    ],
    chart: { demand: [37, 40, 43, 47, 51, 56, 61, 67, 73, 80, 88, 97], capacity: [39, 42, 46, 49, 54, 59, 65, 71, 78, 85, 92, 101], labels: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"], start: "37", end: "101" },
    gridNodes: [
      { name: "BEIJING", x: 66, y: 30, size: 13, status: "TIGHT", tone: "orange" },
      { name: "SHANGHAI", x: 75, y: 55, size: 14, status: "ACTIVE", tone: "cyan" },
      { name: "GUIZHOU", x: 53, y: 62, size: 11, status: "OPEN", tone: "lime" },
      { name: "NINGXIA", x: 43, y: 39, size: 12, status: "ACTIVE", tone: "cyan" },
      { name: "SHENZHEN", x: 67, y: 72, size: 9, status: "WATCH", tone: "violet" },
    ],
  },
};

const filters = ["All signals", "Power", "Policy", "Hardware", "Land & build", "Capital"];

function linePoints(values: number[], width: number, height: number, top = 8, bottom = 11) {
  const maximum = Math.max(...values);
  const minimum = Math.min(...values);
  const range = Math.max(maximum - minimum, 1);
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = top + (1 - (value - minimum) / range) * (height - top - bottom);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function countryCode(country: CountryKey) {
  return country === "us" ? "US" : country === "vietnam" ? "VN" : "CN";
}

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const arrow = metric.direction === "up" ? "↑" : metric.direction === "down" ? "↓" : "•";
  return (
    <article className={`metric-card tone-${metric.tone}`}>
      <div className="metric-topline"><span>{metric.label}</span><span className="metric-live-dot" /></div>
      <div className="metric-value-row"><strong>{metric.value}</strong><span>{metric.unit}</span></div>
      <div className={`metric-change ${metric.direction}`}><span>{arrow} {metric.change}</span><small>{metric.note}</small></div>
    </article>
  );
}

function CapacityChart({ chart }: { chart: CountryData["chart"] }) {
  const demandPoints = linePoints(chart.demand, 600, 202);
  const capacityPoints = linePoints(chart.capacity, 600, 202);
  const areaPoints = `0,202 ${demandPoints} 600,202`;

  return (
    <div className="chart-wrap">
      <svg className="capacity-chart" viewBox="0 0 600 226" role="img" aria-label="Twelve month AI compute demand and commissioned capacity chart">
        <defs>
          <linearGradient id="demand-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#59d7f2" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#59d7f2" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[24, 70, 116, 162, 202].map((y) => <line key={y} x1="0" y1={y} x2="600" y2={y} className="chart-gridline" />)}
        {[150, 300, 450].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="202" className="chart-gridline vertical" />)}
        <polygon points={areaPoints} fill="url(#demand-fill)" />
        <polyline points={capacityPoints} className="chart-line capacity" />
        <polyline points={demandPoints} className="chart-line demand" />
        <circle cx="600" cy={demandPoints.split(" ").at(-1)?.split(",")[1]} r="4.5" className="chart-dot-demand" />
        <circle cx="600" cy={capacityPoints.split(" ").at(-1)?.split(",")[1]} r="4.5" className="chart-dot-capacity" />
        {chart.labels.map((label, index) => (
          <text key={label} x={(index / (chart.labels.length - 1)) * 600} y="220" textAnchor={index === 0 ? "start" : index === chart.labels.length - 1 ? "end" : "middle"} className="chart-label">{label}</text>
        ))}
      </svg>
      <span className="axis-value top">{chart.end}</span>
      <span className="axis-value bottom">{chart.start}</span>
    </div>
  );
}

function RegionMap({ data }: { data: CountryData }) {
  return (
    <div className="region-map" role="img" aria-label={`${data.name} AI infrastructure activity map`}>
      <div className={`map-contour ${data.key}`} />
      <span className="map-ring ring-one" /><span className="map-ring ring-two" /><span className="map-ring ring-three" />
      {data.gridNodes.map((node) => (
        <div className={`map-node tone-${node.tone}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} key={node.name}>
          <span className="node-pulse" style={{ width: node.size, height: node.size }} />
          <div className="node-label"><strong>{node.name}</strong><small>{node.status}</small></div>
        </div>
      ))}
      <div className="map-scale"><span>0</span><i /><span>300 km</span></div>
    </div>
  );
}

export function InfrastructureDashboard() {
  const [activeCountry, setActiveCountry] = useState<CountryKey>("us");
  const [activeFilter, setActiveFilter] = useState("All signals");
  const [selectedArticle, setSelectedArticle] = useState(0);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [leftRailOpen, setLeftRailOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const country = countries[activeCountry];

  const articles = useMemo(() => country.articles.filter((article) => {
    const categoryMatches = activeFilter === "All signals"
      || (activeFilter === "Land & build" && ["LAND", "COST"].includes(article.category))
      || (activeFilter === "Capital" && article.category === "MACRO")
      || article.category === activeFilter.toUpperCase();
    const searchMatches = `${article.title} ${article.summary} ${article.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatches && searchMatches;
  }), [activeFilter, country.articles, query]);

  const activeArticle = articles[Math.min(selectedArticle, Math.max(articles.length - 1, 0))] ?? country.articles[0];

  function switchCountry(nextCountry: CountryKey) {
    setActiveCountry(nextCountry);
    setSelectedArticle(0);
    setActiveFilter("All signals");
  }

  function toggleSaved(title: string) {
    setSaved((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  }

  return (
    <main className="terminal-shell">
      <aside className={`left-rail ${leftRailOpen ? "open" : ""}`}>
        <div className="rail-brand"><LogoMark /><span>INFRA<br />PULSE</span></div>
        <nav className="rail-nav" aria-label="Primary navigation">
          <button className="rail-action active" aria-label="Intelligence desk"><Grid2X2 size={18} /></button>
          <button className="rail-action" aria-label="Infrastructure network"><Network size={18} /></button>
          <button className="rail-action" aria-label="Asset database"><Database size={18} /></button>
          <button className="rail-action" aria-label="Policy monitor"><Landmark size={18} /></button>
        </nav>
        <div className="rail-bottom">
          <button className="rail-action" aria-label="Settings"><Settings2 size={17} /></button>
          <button className="rail-profile" aria-label="User profile"><CircleUserRound size={20} /></button>
        </div>
      </aside>

      <section className="terminal-content">
        <header className="topbar">
          <div className="topbar-title"><button className="mobile-menu" onClick={() => setLeftRailOpen((open) => !open)} aria-label="Toggle navigation"><Menu size={19} /></button><span className="eyebrow">INTELLIGENCE / AI INFRASTRUCTURE</span><span className="separator" /><span className="topbar-region">{country.focus}</span></div>
          <div className="topbar-tools">
            <button className={`status-pill ${notifications ? "enabled" : ""}`} onClick={() => setNotifications((enabled) => !enabled)}><i /> {notifications ? "Live signals" : "Signals paused"}</button>
            <button className="icon-button" aria-label="Notifications"><Bell size={17} /></button>
            <button className="profile-chip">KR <ChevronDown size={13} /></button>
          </div>
        </header>

        <section className="country-switcher" aria-label="Country selection">
          <div className="country-switcher-label"><span className="live-needle" />MARKET LENS</div>
          {(Object.keys(countries) as CountryKey[]).map((key) => (
            <button className={`country-tab ${activeCountry === key ? "active" : ""}`} onClick={() => switchCountry(key)} key={key}>
              <span className={`flag flag-${key}`}>{countryCode(key)}</span>{countries[key].name}
            </button>
          ))}
          <button className="compare-button">Compare <Plus size={14} /></button>
        </section>

        <div className="dashboard-body">
          <section className="main-column">
            <section className="masthead">
              <div>
                <div className="overline"><span className="location-mark" />{country.location} / DAILY INTELLIGENCE</div>
                <h1>AI infrastructure<br /><em>in motion.</em></h1>
                <p>{country.pulse}</p>
              </div>
              <div className="masthead-figure">
                <div className="signal-score"><span>INFRA PULSE</span><strong>7.8</strong><small>/ 10</small><div><i style={{ width: "78%" }} /></div></div>
                <div className="signal-brief"><span>MARKET REGIME</span><strong>Capacity-constrained</strong><small>Power + permitting driving spread</small></div>
              </div>
            </section>

            <section className="metric-grid" aria-label="Key infrastructure metrics">
              {country.metrics.map((metric) => <MetricCard metric={metric} key={metric.label} />)}
            </section>

            <section className="panel capacity-panel">
              <div className="panel-head">
                <div><span className="panel-kicker">CAPACITY OUTLOOK</span><h2>AI load vs. commissioned supply</h2></div>
                <div className="chart-legend"><span><i className="legend-line demand" />Load demand</span><span><i className="legend-line capacity" />Commissioned</span><button>12M <ChevronDown size={13} /></button></div>
              </div>
              <div className="chart-area"><div className="y-caption">GW / EQUIVALENT LOAD</div><CapacityChart chart={country.chart} /></div>
              <div className="panel-footer"><span><Bolt size={14} /> Demand lead widens to <strong>{country.key === "us" ? "11 GW" : country.key === "vietnam" ? "12 GW" : "4 GW"}</strong> in current outlook</span><button>View capacity model <ChevronRight size={14} /></button></div>
            </section>

            <section className="news-section">
              <div className="news-head">
                <div><span className="panel-kicker">SIGNAL STREAM</span><h2>What moves the build</h2></div>
                <div className="feed-controls"><div className="filter-wrap"><Filter size={14} /><select aria-label="Filter signals" value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setSelectedArticle(0); }}>{filters.map((filter) => <option key={filter}>{filter}</option>)}</select></div><label className="feed-search"><Search size={14} /><input value={query} onChange={(event) => { setQuery(event.target.value); setSelectedArticle(0); }} placeholder="Search signals" /></label></div>
              </div>
              <div className="news-table">
                {articles.length > 0 ? articles.map((article, index) => {
                  const isSaved = saved.includes(article.title);
                  return (
                    <article className={`news-row ${activeArticle.title === article.title ? "selected" : ""}`} key={article.title} onClick={() => setSelectedArticle(index)}>
                      <time>{article.time}</time>
                      <div className="news-source"><i style={{ background: article.sourceColor }} />{article.source}</div>
                      <div className="news-copy"><div><span className={`impact ${article.impact.toLowerCase()}`}>{article.impact}</span><h3>{article.title}</h3></div><p>{article.summary}</p></div>
                      <button className={`bookmark ${isSaved ? "saved" : ""}`} aria-label="Save story" onClick={(event) => { event.stopPropagation(); toggleSaved(article.title); }}><Bookmark size={16} fill={isSaved ? "currentColor" : "none"} /></button>
                    </article>
                  );
                }) : <div className="empty-results"><Search size={18} /><strong>No matching signals</strong><span>Try another topic or clear search.</span><button onClick={() => { setQuery(""); setActiveFilter("All signals"); }}>Reset filters</button></div>}
              </div>
            </section>
          </section>

          <aside className="right-column">
            <section className="panel detail-panel">
              <div className="panel-head compact"><span className="panel-kicker">SIGNAL DETAIL</span><button className="detail-close" onClick={() => setSelectedArticle(0)} aria-label="Reset story"><X size={15} /></button></div>
              <span className={`impact ${activeArticle.impact.toLowerCase()}`}>{activeArticle.impact} IMPACT</span>
              <h2>{activeArticle.title}</h2>
              <p>{activeArticle.summary}</p>
              <div className="story-tags">{activeArticle.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="detail-footer"><span><i style={{ background: activeArticle.sourceColor }} />{activeArticle.source} · {activeArticle.time}</span><button aria-label="Open source"><ExternalLink size={15} /></button></div>
            </section>

            <section className="panel map-panel">
              <div className="panel-head compact"><div><span className="panel-kicker">ACTIVITY MAP</span><h2>Build pressure</h2></div><button className="map-control">Grid view <ChevronDown size={12} /></button></div>
              <RegionMap data={country} />
              <div className="map-legend"><span><i className="legend-dot cyan" />Active</span><span><i className="legend-dot lime" />Open</span><span><i className="legend-dot orange" />Tight</span></div>
            </section>

            <section className="panel watchlist-panel">
              <div className="panel-head compact"><div><span className="panel-kicker">MARKET TAPE</span><h2>Watchlist</h2></div><button className="plain-action">Edit</button></div>
              <div className="watchlist-table">
                {country.watchlist.map((item) => <div className="watch-row" key={item.code}><div><strong>{item.code}</strong><span>{item.label}</span></div><span>{item.value}</span><em className={item.direction}>{item.direction === "up" ? "↑" : "↓"} {item.change}</em></div>)}
              </div>
            </section>

            <section className="panel events-panel">
              <div className="panel-head compact"><div><span className="panel-kicker">CATALYSTS</span><h2>Calendar</h2></div><button className="plain-action">All events</button></div>
              {country.events.map((event) => <div className="event-row" key={event.title}><time>{event.date}</time><i className={`event-dot tone-${event.tone}`} /><div><strong>{event.title}</strong><span>{event.category}</span></div></div>)}
            </section>
          </aside>
        </div>

        <footer className="terminal-footer"><div><span className="pulse-dot" /> SIGNAL DESK · DEMONSTRATION DATA</div><div>Last cycle <strong>{country.date}</strong> <span className="footer-divider" /> 187 sources monitored <span className="footer-divider" /> <CircleHelp size={13} /> Methodology</div></footer>
      </section>
    </main>
  );
}
