import { createHash } from "node:crypto";
import { getFeedSnapshot } from "../../../lib/feed";
import { sourceMeta } from "../../../lib/source-meta";
import { getTerminalFeed } from "../../../lib/terminal-feed";
import type { FeedItem } from "../../../lib/types";

export type NormalizedRecord = {
  sourceItemKey: string;
  sourceId: string;
  sourceName: string;
  sourceHomepage: string;
  region: string | null;
  category: string | null;
  title: string;
  excerpt: string | null;
  author: string | null;
  canonicalUrl: string;
  canonicalUrlHash: string;
  contentHash: string;
  language: string | null;
  score: number | null;
  comments: number | null;
  publishedAt: string;
  rawMetadata: Record<string, unknown>;
};

export type SourceDefinition = {
  id: string;
  name: string;
  homepageUrl: string;
  endpointUrl: string;
  channel: "rss" | "api" | "html" | "manual";
  region: string | null;
  category: string | null;
};

function dateOrEpoch(value?: string): string {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? new Date(0).toISOString() : new Date(parsed).toISOString();
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function canonicalizeUrl(value: string): string {
  const url = new URL(value);
  url.protocol = url.protocol === "http:" ? "https:" : url.protocol;
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_)/i.test(key)) url.searchParams.delete(key);
  }
  url.pathname = url.pathname.replace(/\/$/, "") || "/";
  return url.toString();
}

function languageFor(region: string | null, title: string): string | null {
  if (region === "vietnam") return "vi";
  if (region === "china") return "zh";
  if (/[^\u0000-\u007f]/.test(title)) return null;
  return "en";
}

function recordFrom(value: Omit<NormalizedRecord, "canonicalUrlHash" | "contentHash">): NormalizedRecord {
  return {
    ...value,
    canonicalUrlHash: hash(value.canonicalUrl),
    contentHash: hash(`${value.title.trim()}\n${value.excerpt?.trim() ?? ""}`),
  };
}

function normalizeFeedItem(item: FeedItem): NormalizedRecord {
  let homepage = "https://www.solo.engineer";
  try { homepage = new URL(item.url).origin; } catch { /* source URL already validated by upstream adapter */ }
  const canonicalUrl = canonicalizeUrl(item.url);
  return recordFrom({
    sourceItemKey: item.id,
    sourceId: item.source,
    sourceName: sourceMeta[item.source]?.label || item.author || item.source,
    sourceHomepage: homepage,
    region: null,
    category: item.tag || null,
    title: item.title,
    excerpt: item.summary || null,
    author: item.author || null,
    canonicalUrl,
    language: languageFor(null, item.title),
    score: item.score ?? null,
    comments: item.comments ?? null,
    publishedAt: dateOrEpoch(item.publishedAt),
    rawMetadata: { tag: item.tag, authorHandle: item.authorHandle },
  });
}

function categoryId(value: string): string {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function terminalSourceDefinitions(): SourceDefinition[] {
  return [
    { id: "eia", name: "U.S. Energy Information Administration", homepageUrl: "https://www.eia.gov/", endpointUrl: "https://www.eia.gov/rss/todayinenergy.xml", channel: "rss", region: "us", category: "power-and-grid" },
    { id: "federal-register-bis", name: "Federal Register — Bureau of Industry and Security", homepageUrl: "https://www.federalregister.gov/agencies/bureau-of-industry-and-security", endpointUrl: "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=industry-and-security-bureau&conditions%5Bterm%5D=advanced%20computing&order=newest&per_page=8", channel: "api", region: "us", category: "policy-and-controls" },
    { id: "nist-chips", name: "NIST CHIPS for America", homepageUrl: "https://www.nist.gov/chips", endpointUrl: "https://www.nist.gov/chips/chips-news-releases", channel: "html", region: "us", category: "hardware-and-compute" },
    { id: "federal-reserve", name: "Federal Reserve", homepageUrl: "https://www.federalreserve.gov/", endpointUrl: "https://www.federalreserve.gov/feeds/press_monetary.xml", channel: "rss", region: "us", category: "capital-and-costs" },
    { id: "vietnam-government", name: "Government News of Vietnam", homepageUrl: "https://baochinhphu.vn/", endpointUrl: "https://baochinhphu.vn/home.rss", channel: "rss", region: "vietnam", category: "policy-and-controls" },
    { id: "vietnam-science-technology", name: "Vietnam Ministry of Science and Technology", homepageUrl: "https://mst.gov.vn/", endpointUrl: "https://mst.gov.vn/rss/home.rss", channel: "rss", region: "vietnam", category: "technology-and-research" },
    { id: "evn", name: "Electricity of Vietnam", homepageUrl: "https://en.evn.com.vn/", endpointUrl: "https://en.evn.com.vn/", channel: "html", region: "vietnam", category: "power-and-grid" },
    { id: "moit", name: "Vietnam Ministry of Industry and Trade", homepageUrl: "https://moit.gov.vn/en/", endpointUrl: "https://moit.gov.vn/en/", channel: "html", region: "vietnam", category: "capital-and-costs" },
    { id: "ndrc-notices", name: "National Development and Reform Commission", homepageUrl: "https://www.ndrc.gov.cn/", endpointUrl: "https://www.ndrc.gov.cn/xxgk/zcfb/tz/", channel: "html", region: "china", category: "power-and-grid" },
    { id: "ndrc-releases", name: "National Development and Reform Commission", homepageUrl: "https://www.ndrc.gov.cn/", endpointUrl: "https://www.ndrc.gov.cn/xwdt/xwfb/", channel: "html", region: "china", category: "policy-and-controls" },
    { id: "nea", name: "National Energy Administration", homepageUrl: "https://www.nea.gov.cn/", endpointUrl: "https://www.nea.gov.cn/", channel: "html", region: "china", category: "power-and-grid" },
    { id: "miit", name: "Ministry of Industry and Information Technology", homepageUrl: "https://www.miit.gov.cn/", endpointUrl: "https://www.miit.gov.cn/", channel: "html", region: "china", category: "hardware-and-compute" },
  ];
}

export function getSourceDefinitions(): SourceDefinition[] {
  const byId = new Map<string, SourceDefinition>();
  for (const source of terminalSourceDefinitions()) byId.set(source.id, source);
  return [...byId.values()];
}

export async function collectRecords() {
  const [feed, terminal] = await Promise.all([getFeedSnapshot(null), getTerminalFeed()]);
  const records = [
    ...feed.items.map(normalizeFeedItem),
    ...terminal.items.flatMap((item) => {
      try {
        const canonicalUrl = canonicalizeUrl(item.url);
        return [recordFrom({
          sourceItemKey: item.id,
          sourceId: item.sourceId,
          sourceName: item.sourceName,
          sourceHomepage: item.sourceHomepage,
          region: item.region,
          category: categoryId(item.category),
          title: item.title,
          excerpt: item.summary || null,
          author: null,
          canonicalUrl,
          language: languageFor(item.region, item.title),
          score: null,
          comments: null,
          publishedAt: dateOrEpoch(item.publishedAt),
          rawMetadata: { terminalCategory: item.category },
        })];
      } catch { return []; }
    }),
  ];
  const seen = new Set<string>();
  const deduped = records.filter((record) => seen.has(record.canonicalUrlHash) ? false : (seen.add(record.canonicalUrlHash), true));
  return { records: deduped, statuses: [...feed.statuses, ...terminal.statuses], fetchedAt: new Date().toISOString() };
}

export function normalizeForTest(item: FeedItem): NormalizedRecord { return normalizeFeedItem(item); }
