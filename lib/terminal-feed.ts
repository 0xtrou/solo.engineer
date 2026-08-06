export const terminalRegionIds = ["us", "vietnam", "china"] as const;

export type TerminalRegionId = (typeof terminalRegionIds)[number];
export type TerminalCategory = "Power & grid" | "Policy & controls" | "Hardware & compute" | "Capital & costs" | "Technology & research";

export type TerminalArticle = {
  id: string;
  region: TerminalRegionId;
  category: TerminalCategory;
  sourceId: string;
  sourceName: string;
  sourceHomepage: string;
  title: string;
  url: string;
  publishedAt?: string;
  summary?: string;
};

export type TerminalSourceStatus = {
  sourceId: string;
  region: TerminalRegionId;
  category: TerminalCategory;
  name: string;
  homepage: string;
  endpoint: string;
  loaded: boolean;
  itemCount: number;
  message?: string;
};

export type TerminalFeedResponse = {
  items: TerminalArticle[];
  statuses: TerminalSourceStatus[];
  fetchedAt: string;
};

type SourceDefinition = Omit<TerminalSourceStatus, "loaded" | "itemCount" | "message">;
type RssEntry = { title: string; url: string; summary?: string; publishedAt?: string };

const REVALIDATE_SECONDS = 300;
const sourceRequestInit: RequestInit & { next: { revalidate: number } } = {
  next: { revalidate: REVALIDATE_SECONDS },
  headers: { "User-Agent": "SignalDesk/1.0 (personal research reader)" },
};

const sourceDefinitions = {
  eia: {
    sourceId: "eia",
    region: "us",
    category: "Power & grid",
    name: "U.S. Energy Information Administration",
    homepage: "https://www.eia.gov/",
    endpoint: "https://www.eia.gov/rss/todayinenergy.xml",
  },
  federalRegister: {
    sourceId: "federal-register-bis",
    region: "us",
    category: "Policy & controls",
    name: "Federal Register — Bureau of Industry and Security",
    homepage: "https://www.federalregister.gov/agencies/bureau-of-industry-and-security",
    endpoint: "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=industry-and-security-bureau&conditions%5Bterm%5D=advanced%20computing&order=newest&per_page=8",
  },
  nistChips: {
    sourceId: "nist-chips",
    region: "us",
    category: "Hardware & compute",
    name: "NIST CHIPS for America",
    homepage: "https://www.nist.gov/chips",
    endpoint: "https://www.nist.gov/chips/chips-news-releases",
  },
  federalReserve: {
    sourceId: "federal-reserve",
    region: "us",
    category: "Capital & costs",
    name: "Federal Reserve",
    homepage: "https://www.federalreserve.gov/",
    endpoint: "https://www.federalreserve.gov/feeds/press_monetary.xml",
  },
  vietnamGovernment: {
    sourceId: "vietnam-government",
    region: "vietnam",
    category: "Policy & controls",
    name: "Government News of Vietnam",
    homepage: "https://baochinhphu.vn/",
    endpoint: "https://baochinhphu.vn/home.rss",
  },
  vietnamScience: {
    sourceId: "vietnam-science-technology",
    region: "vietnam",
    category: "Technology & research",
    name: "Vietnam Ministry of Science and Technology",
    homepage: "https://mst.gov.vn/",
    endpoint: "https://mst.gov.vn/rss/home.rss",
  },
  evn: {
    sourceId: "evn",
    region: "vietnam",
    category: "Power & grid",
    name: "Electricity of Vietnam",
    homepage: "https://en.evn.com.vn/",
    endpoint: "https://en.evn.com.vn/",
  },
  moit: {
    sourceId: "moit",
    region: "vietnam",
    category: "Capital & costs",
    name: "Vietnam Ministry of Industry and Trade",
    homepage: "https://moit.gov.vn/en/",
    endpoint: "https://moit.gov.vn/en/",
  },
  ndrcNotices: {
    sourceId: "ndrc-notices",
    region: "china",
    category: "Power & grid",
    name: "National Development and Reform Commission",
    homepage: "https://www.ndrc.gov.cn/",
    endpoint: "https://www.ndrc.gov.cn/xxgk/zcfb/tz/",
  },
  ndrcReleases: {
    sourceId: "ndrc-releases",
    region: "china",
    category: "Policy & controls",
    name: "National Development and Reform Commission",
    homepage: "https://www.ndrc.gov.cn/",
    endpoint: "https://www.ndrc.gov.cn/xwdt/xwfb/",
  },
  nea: {
    sourceId: "nea",
    region: "china",
    category: "Power & grid",
    name: "National Energy Administration",
    homepage: "https://www.nea.gov.cn/",
    endpoint: "https://www.nea.gov.cn/",
  },
  miit: {
    sourceId: "miit",
    region: "china",
    category: "Hardware & compute",
    name: "Ministry of Industry and Information Technology",
    homepage: "https://www.miit.gov.cn/",
    endpoint: "https://www.miit.gov.cn/",
  },
} as const satisfies Record<string, SourceDefinition>;

const relevanceTerms: Partial<Record<string, string[]>> = {
  eia: ["electricity", "power", "grid", "load", "generation", "data center", "battery", "transmission", "lng", "natural gas"],
  "vietnam-government": ["trí tuệ nhân tạo", "chuyển đổi số", "dữ liệu", "bán dẫn", "vi mạch", "công nghệ số", "công nghệ chiến lược", "năng lượng", "điện lực", "lưới điện", "hạ tầng số", "viễn thông", "an ninh mạng"],
  "vietnam-science-technology": ["trí tuệ nhân tạo", "chuyển đổi số", "dữ liệu", "bán dẫn", "vi mạch", "công nghệ số", "công nghệ chiến lược", "hạ tầng số", "viễn thông"],
  moit: ["energy", "electricity", "power", "grid", "semiconductor", "data center", "digital transformation", "renewable", "transmission"],
  "ndrc-notices": ["人工智能", "算力", "数据", "电力", "能源", "电网", "集成电路", "芯片", "数字", "新型电力系统", "储能"],
  "ndrc-releases": ["人工智能", "算力", "数据", "电力", "能源", "电网", "集成电路", "芯片", "数字", "新型电力系统", "储能"],
  miit: ["人工智能", "算力", "数据中心", "数据", "芯片", "半导体", "集成电路", "通信", "网络", "数字", "智能"],
};

const titleOnlyRelevanceSources = new Set(["eia", "vietnam-government", "vietnam-science-technology", "moit"]);

function stripHtml(value: string | undefined): string {
  return decodeEntities((value ?? "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeUrl(value: string | undefined, base: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(decodeEntities(value.trim()), base);
    if (!/^https?:$/.test(url.protocol) || /detail\.php\?id=$/.test(url.toString())) return undefined;
    if (url.protocol === "http:") url.protocol = "https:";
    return url.toString();
  } catch {
    return undefined;
  }
}

function xmlValue(xml: string, tag: string): string | undefined {
  return xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1];
}

function parseDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\//g, "-");
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
}

function parseRss(xml: string, base: string): RssEntry[] {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].flatMap((match) => {
    const item = match[1];
    const title = stripHtml(xmlValue(item, "title"));
    const url = normalizeUrl(stripHtml(xmlValue(item, "link")), base);
    if (!title || !url) return [];
    return [{
      title,
      url,
      summary: stripHtml(xmlValue(item, "description")) || undefined,
      publishedAt: parseDate(stripHtml(xmlValue(item, "pubDate")) || stripHtml(xmlValue(item, "dc:date"))),
    }];
  });
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { ...sourceRequestInit, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { ...sourceRequestInit, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

function getAttribute(value: string, attribute: string): string | undefined {
  return value.match(new RegExp(`\\b${attribute}=["']([^"']+)["']`, "i"))?.[1];
}

function htmlLinks(html: string, base: string): RssEntry[] {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    const url = normalizeUrl(getAttribute(match[1], "href"), base);
    const title = stripHtml(getAttribute(match[1], "title") || match[2]);
    if (!url || !title || title.length < 12) return [];
    return [{ title, url }];
  });
}

function getNistEntries(html: string): RssEntry[] {
  return [...html.matchAll(/<article\b[^>]*class=["'][^"']*nist-teaser[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)].flatMap((match) => {
    const article = match[1];
    const linkMatch = article.match(/<h3[^>]*nist-teaser__title[^>]*>[\s\S]*?<a\b([^>]*)>([\s\S]*?)<\/a>/i);
    const url = normalizeUrl(getAttribute(linkMatch?.[1] ?? "", "href"), sourceDefinitions.nistChips.homepage);
    const title = stripHtml(linkMatch?.[2]);
    if (!url || !title) return [];
    const time = article.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1];
    const summary = stripHtml(article.match(/class=["'][^"']*text-with-summary[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
    return [{ title, url, publishedAt: parseDate(time), summary: summary || undefined }];
  });
}

function getNdrCEntries(html: string, source: SourceDefinition): RssEntry[] {
  return [...html.matchAll(/<li>\s*<a\b([^>]*)>([\s\S]*?)<\/a>[\s\S]*?<span>(\d{4}\/\d{2}\/\d{2})<\/span>\s*<\/li>/gi)].flatMap((match) => {
    const url = normalizeUrl(getAttribute(match[1], "href"), source.endpoint);
    const title = stripHtml(getAttribute(match[1], "title") || match[2]);
    if (!url || !title) return [];
    return [{ title, url, publishedAt: parseDate(match[3]) }];
  });
}

function getMiitEntries(html: string): RssEntry[] {
  return [...html.matchAll(/<li>\s*<span>(\d{4}-\d{2}-\d{2})<\/span>\s*<p><a\b([^>]*)>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    const url = normalizeUrl(getAttribute(match[2], "href"), sourceDefinitions.miit.homepage);
    const title = stripHtml(getAttribute(match[2], "title") || match[3]);
    if (!url || !title) return [];
    return [{ title, url, publishedAt: parseDate(match[1]) }];
  });
}

function getNeaEntries(html: string): RssEntry[] {
  return htmlLinks(html, sourceDefinitions.nea.homepage)
    .filter((entry) => /20\d{6}\//.test(entry.url))
    .map((entry) => {
      const date = entry.url.match(/(20\d{2})(\d{2})(\d{2})\//);
      return { ...entry, publishedAt: date ? parseDate(`${date[1]}-${date[2]}-${date[3]}`) : undefined };
    });
}

function getMoitEntries(html: string): RssEntry[] {
  return [...html.matchAll(/<div class=["']time-new["'][^>]*>[\s\S]*?<\/div>\s*<div class=["']article-title[^"']*["'][^>]*>\s*<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    const url = normalizeUrl(getAttribute(match[1], "href"), sourceDefinitions.moit.homepage);
    const title = stripHtml(getAttribute(match[1], "title") || match[2]);
    const dateMatch = match[0].match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!url || !title) return [];
    return [{ title, url, publishedAt: dateMatch ? parseDate(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`) : undefined }];
  });
}

async function getEvnEntries(): Promise<RssEntry[]> {
  const homepage = await fetchText(sourceDefinitions.evn.endpoint);
  const articles = htmlLinks(homepage, sourceDefinitions.evn.homepage)
    .filter((entry) => /\/d\/en-US\/news\//.test(entry.url))
    .filter((entry, index, all) => all.findIndex((candidate) => candidate.url === entry.url) === index)
    .slice(0, 4);

  const resolved = await Promise.all(articles.map(async (entry) => {
    try {
      const article = await fetchText(entry.url);
      const title = stripHtml(article.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1]) || entry.title;
      const summary = stripHtml(article.match(/class=["'][^"']*tintuc-detail-pTextInImgText[^"']*fs-3[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
      const date = article.match(/(\d{2}:\d{2}),\s*(\d{2})\/(\d{2})\/(\d{4})/);
      return { title, url: entry.url, summary: summary || undefined, publishedAt: date ? parseDate(`${date[4]}-${date[3]}-${date[2]}T${date[1]}`) : undefined };
    } catch {
      return entry;
    }
  }));

  return resolved;
}

function toArticles(source: SourceDefinition, entries: RssEntry[], limit = 5): TerminalArticle[] {
  const seen = new Set<string>();
  const terms = relevanceTerms[source.sourceId];
  return entries.filter((entry) => {
    if (!terms) return true;
    const text = `${entry.title}${titleOnlyRelevanceSources.has(source.sourceId) ? "" : ` ${entry.summary ?? ""}`}`.toLowerCase();
    return terms.some((term) => text.includes(term.toLowerCase()));
  }).flatMap((entry) => {
    const identity = `${entry.title}:${entry.url}`;
    if (seen.has(identity)) return [];
    seen.add(identity);
    return [{
      id: `${source.sourceId}:${entry.url}`,
      region: source.region,
      category: source.category,
      sourceId: source.sourceId,
      sourceName: source.name,
      sourceHomepage: source.homepage,
      title: entry.title,
      url: entry.url,
      publishedAt: entry.publishedAt,
      summary: entry.summary,
    }];
  }).slice(0, limit);
}

async function getFederalRegisterEntries(): Promise<RssEntry[]> {
  const result = await fetchJson<{ results?: Array<{ document_number: string; title?: string; abstract?: string; publication_date?: string; html_url?: string }> }>(sourceDefinitions.federalRegister.endpoint);
  return (result.results ?? []).flatMap((document) => {
    if (!document.title || !document.html_url) return [];
    return [{ title: document.title, url: document.html_url, summary: stripHtml(document.abstract), publishedAt: parseDate(document.publication_date) }];
  });
}

type Adapter = { source: SourceDefinition; load: () => Promise<RssEntry[]> };

const adapters: Adapter[] = [
  { source: sourceDefinitions.eia, load: async () => parseRss(await fetchText(sourceDefinitions.eia.endpoint), sourceDefinitions.eia.homepage) },
  { source: sourceDefinitions.federalRegister, load: getFederalRegisterEntries },
  { source: sourceDefinitions.nistChips, load: async () => getNistEntries(await fetchText(sourceDefinitions.nistChips.endpoint)) },
  { source: sourceDefinitions.federalReserve, load: async () => parseRss(await fetchText(sourceDefinitions.federalReserve.endpoint), sourceDefinitions.federalReserve.homepage) },
  { source: sourceDefinitions.vietnamGovernment, load: async () => parseRss(await fetchText(sourceDefinitions.vietnamGovernment.endpoint), sourceDefinitions.vietnamGovernment.homepage) },
  { source: sourceDefinitions.vietnamScience, load: async () => parseRss(await fetchText(sourceDefinitions.vietnamScience.endpoint), sourceDefinitions.vietnamScience.homepage) },
  { source: sourceDefinitions.evn, load: getEvnEntries },
  { source: sourceDefinitions.moit, load: async () => getMoitEntries(await fetchText(sourceDefinitions.moit.endpoint)) },
  { source: sourceDefinitions.ndrcNotices, load: async () => getNdrCEntries(await fetchText(sourceDefinitions.ndrcNotices.endpoint), sourceDefinitions.ndrcNotices) },
  { source: sourceDefinitions.ndrcReleases, load: async () => getNdrCEntries(await fetchText(sourceDefinitions.ndrcReleases.endpoint), sourceDefinitions.ndrcReleases) },
  { source: sourceDefinitions.nea, load: async () => getNeaEntries(await fetchText(sourceDefinitions.nea.endpoint)) },
  { source: sourceDefinitions.miit, load: async () => getMiitEntries(await fetchText(sourceDefinitions.miit.endpoint)) },
];

export function isTerminalRegion(value: string | null | undefined): value is TerminalRegionId {
  return typeof value === "string" && terminalRegionIds.includes(value as TerminalRegionId);
}

export function getTerminalSourceStatuses(): TerminalSourceStatus[] {
  return Object.values(sourceDefinitions).map((source) => ({
    ...source,
    loaded: false,
    itemCount: 0,
    message: "Loading source status",
  }));
}

export async function getTerminalFeed(): Promise<TerminalFeedResponse> {
  const results = await Promise.all(adapters.map(async ({ source, load }) => {
    try {
      const items = toArticles(source, await load());
      return {
        items,
        status: {
          ...source,
          loaded: true,
          itemCount: items.length,
          message: items.length === 0 ? "No current infrastructure-matched records" : undefined,
        } satisfies TerminalSourceStatus,
      };
    } catch (error) {
      return {
        items: [] as TerminalArticle[],
        status: {
          ...source,
          loaded: false,
          itemCount: 0,
          message: error instanceof Error ? error.message : "Source unavailable",
        } satisfies TerminalSourceStatus,
      };
    }
  }));

  return {
    items: results.flatMap((result) => result.items).sort((left, right) => {
      const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;
      return rightTime - leftTime;
    }),
    statuses: results.map((result) => result.status),
    fetchedAt: new Date().toISOString(),
  };
}
