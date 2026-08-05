import { filterAndRank } from "@/lib/topics";
import type { FeedItem, FeedResponse, SourceId, SourceStatus } from "@/lib/types";

const REVALIDATE_SECONDS = 300;
const TOP_STORY_COUNT = 36;
const PER_SOURCE_LIMIT = 7;

const requestInit: RequestInit & { next: { revalidate: number } } = {
  next: { revalidate: REVALIDATE_SECONDS },
  headers: { "User-Agent": "Mozilla/5.0 SignalDesk/1.0" },
};

type HackerNewsStory = { id: number; title?: string; url?: string; by?: string; time?: number; score?: number; descendants?: number; type?: string; text?: string };
type DevArticle = { id: number; title: string; description?: string; published_at: string; positive_reactions_count?: number; comments_count?: number; tag_list?: string[]; url: string; user?: { name?: string; username?: string } };
type StackQuestion = { question_id: number; title: string; link: string; creation_date: number; score?: number; answer_count?: number; tags?: string[]; body?: string; owner?: { display_name?: string } };
type GitHubDiscussion = { number: number; title: string; html_url: string; created_at: string; comments?: number; category?: { name?: string }; user?: { login?: string } };
type BlueskyPost = { post: { uri: string; author: { displayName?: string; handle: string }; record: { text?: string; createdAt: string }; replyCount?: number; likeCount?: number } };
type FederalDocument = { document_number: string; title: string; abstract?: string; publication_date: string; html_url: string; agencies?: Array<{ name?: string }>; type?: string };
type VietnamDocument = { _id: string; tenvb?: string; mavb?: string; tomtat?: string; ngaybanhanh?: string; ngaycapnhat?: string; linhvuc_id?: Array<{ tenlinhvuc_en?: string }>; coquanbanhanh_id?: Array<{ tencoquan_en?: string }> };
type WorldBankObservation = { indicator?: { value?: string }; country?: { value?: string }; countryiso3code?: string; date?: string; value?: number | null };

const vietnamTopicTerms = [
  "administrative",
  "business",
  "commerce",
  "competition",
  "cyber",
  "data",
  "digital",
  "economy",
  "electronic",
  "enterprise",
  "finance",
  "government",
  "information technology",
  "insurance",
  "investment",
  "labor",
  "public administration",
  "science",
  "social insurance",
  "tax",
  "technology",
  "telecommunications",
  "trade",
];

function stripHtml(input: string | undefined): string {
  let decoded = (input ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .trim();

  for (let index = 0; index < 3; index += 1) {
    const next = decoded
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    if (next === decoded) break;
    decoded = next;
  }

  return decoded
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(input: string, limit = 240): string {
  const clean = input.trim();
  return clean.length > limit ? `${clean.slice(0, limit - 1).trimEnd()}…` : clean;
}

function stripCdata(value: string | undefined): string {
  return (value ?? "").replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1").trim();
}

function xmlValue(xml: string, tag: string): string | undefined {
  return xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1];
}

function xmlValues(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi"))].map((match) => match[1]);
}

function parseRssItems(xml: string) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match, index) => {
    const item = match[1];
    const categories = xmlValues(item, "category");
    return {
      id: xmlValue(item, "guid") || `${xmlValue(item, "link") || "item"}-${index}`,
      title: stripHtml(stripCdata(xmlValue(item, "title"))),
      link: stripCdata(xmlValue(item, "link")),
      description: stripHtml(stripCdata(xmlValue(item, "description"))),
      author: stripHtml(stripCdata(xmlValue(item, "dc:creator"))),
      publishedAt: stripCdata(xmlValue(item, "pubDate")) || stripCdata(xmlValue(item, "dc:date")),
      category: stripHtml(stripCdata(categories[0])),
    };
  });
}

async function fetchJson<T>(url: string, init: RequestInit = requestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

async function fetchRss(url: string) {
  const response = await fetch(url, requestInit);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return parseRssItems(await response.text());
}

function getHackerNews(): Promise<FeedItem[]> {
  return fetchJson<number[]>("https://hacker-news.firebaseio.com/v0/topstories.json").then(async (ids) => {
    const stories = await Promise.all(ids.slice(0, TOP_STORY_COUNT).map((id) => fetchJson<HackerNewsStory>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)));
    return stories
      .filter((story) => story.type === "story" && story.title)
      .map((story) => ({
        id: `hn-${story.id}`,
        source: "hacker-news" as const,
        title: story.title || "Untitled story",
        summary: shorten(stripHtml(story.text) || "Open the technical discussion on Hacker News."),
        author: story.by || "Hacker News",
        authorHandle: story.by ? `@${story.by}` : undefined,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        publishedAt: new Date((story.time || 0) * 1000).toISOString(),
        score: story.score,
        comments: story.descendants,
        tag: "Tech discussion",
      }));
  });
}

async function getDev(): Promise<FeedItem[]> {
  const articles = await fetchJson<DevArticle[]>("https://dev.to/api/articles?per_page=20&top=7");
  return articles.map((article) => ({
    id: `dev-${article.id}`,
    source: "dev" as const,
    title: article.title,
    summary: shorten(article.description || "Open this DEV Community post."),
    author: article.user?.name || article.user?.username || "DEV Community",
    authorHandle: article.user?.username ? `@${article.user.username}` : undefined,
    url: article.url,
    publishedAt: article.published_at,
    score: article.positive_reactions_count,
    comments: article.comments_count,
    tag: article.tag_list?.[0],
  }));
}

async function getStackOverflow(): Promise<FeedItem[]> {
  const result = await fetchJson<{ items: StackQuestion[] }>("https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&site=stackoverflow&pagesize=20&filter=withbody");
  return result.items.map((question) => ({
    id: `so-${question.question_id}`,
    source: "stack-overflow" as const,
    title: stripHtml(question.title),
    summary: shorten(stripHtml(question.body) || "Open this Stack Overflow question."),
    author: question.owner?.display_name || "Stack Overflow user",
    url: question.link,
    publishedAt: new Date(question.creation_date * 1000).toISOString(),
    score: question.score,
    comments: question.answer_count,
    tag: question.tags?.[0],
  }));
}

async function getGitHubDiscussions(): Promise<FeedItem[]> {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Mozilla/5.0 SignalDesk/1.0",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
  const discussions = await fetchJson<GitHubDiscussion[]>("https://api.github.com/repos/vercel/next.js/discussions?per_page=20", { next: { revalidate: REVALIDATE_SECONDS }, headers });
  return discussions.map((discussion) => ({
    id: `github-${discussion.number}`,
    source: "github" as const,
    title: discussion.title,
    summary: `Discussion in ${discussion.category?.name || "the Next.js repository"}.`,
    author: discussion.user?.login || "GitHub user",
    authorHandle: discussion.user?.login ? `@${discussion.user.login}` : undefined,
    url: discussion.html_url,
    publishedAt: discussion.created_at,
    comments: discussion.comments,
    tag: discussion.category?.name,
  }));
}

async function getIndieHackers(): Promise<FeedItem[]> {
  const response = await fetch("https://www.indiehackers.com/", requestInit);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const cards = [...html.matchAll(/<div[^>]*class="[^"]*\bstory\b[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*\bstory\b|<div[^>]*class="[^"]*featured|$)/g)]
    .map((match) => parseIndieHackerCard(match[1]));
  const seen = new Set<string>();
  return cards
    .filter((card): card is NonNullable<typeof card> => Boolean(card))
    .filter(({ href }) => (seen.has(href) ? false : (seen.add(href), true)))
    .map(({ href, title, author, score, comments }, index) => ({
      id: `indie-${href}`,
      source: "indie-hackers" as const,
      title,
      summary: "Open this build story on Indie Hackers.",
      author: author || "Indie Hackers",
      url: `https://www.indiehackers.com${href}`,
      publishedAt: new Date(Date.now() - index * 60_000).toISOString(),
      score,
      comments,
      tag: "Business growth",
    }));
}

function parseIndieHackerCard(html: string) {
  const heading = html.match(/<a href="([^\"]+)"[^>]*class="[^"]*story__text-link[^"]*"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/);
  if (!heading) return null;
  const href = heading[1];
  if (!(href.startsWith("/post/") || href.startsWith("/product/"))) return null;
  const title = stripHtml(heading[2]);
  if (!title) return null;
  const author = stripHtml(html.match(/user-link__name[^"]*">\s*([\s\S]*?)\s*<\/span>/)?.[1]);
  const counts = [...html.matchAll(/story__count-number">\s*(\d+)\s*<\/span>/g)].map((match) => Number(match[1]));
  return { href, title, author, score: counts[0], comments: counts[1] };
}

async function getArxiv(): Promise<FeedItem[]> {
  const entries = await fetchRss("https://rss.arxiv.org/rss/cs.AI");
  return entries.map((entry) => ({
    id: `arxiv-${entry.id}`,
    source: "arxiv" as const,
    title: entry.title,
    summary: shorten(entry.description || "Open this arXiv paper."),
    author: entry.author || "arXiv authors",
    url: entry.link,
    publishedAt: new Date(entry.publishedAt).toISOString(),
    tag: entry.category || "AI research",
  }));
}

async function getEuRegulation(): Promise<FeedItem[]> {
  const entries = await fetchRss("https://digital-strategy.ec.europa.eu/en/rss.xml");
  return entries.map((entry) => ({
    id: `eu-${entry.id}`,
    source: "eu-regulation" as const,
    title: entry.title,
    summary: shorten(entry.description || "Open this European Commission digital policy update."),
    author: "European Commission",
    url: entry.link,
    publishedAt: new Date(entry.publishedAt).toISOString(),
    tag: "EU digital policy",
  }));
}

async function getUsRegulation(): Promise<FeedItem[]> {
  const result = await fetchJson<{ results: FederalDocument[] }>("https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D=artificial%20intelligence&conditions%5Btype%5D%5B%5D=RULE&conditions%5Btype%5D%5B%5D=PRORULE&order=newest&per_page=20");
  return result.results.map((document) => ({
    id: `federal-${document.document_number}`,
    source: "us-regulation" as const,
    title: document.title,
    summary: shorten(document.abstract || "Open this Federal Register document."),
    author: document.agencies?.[0]?.name || "Federal Register",
    url: document.html_url,
    publishedAt: new Date(document.publication_date).toISOString(),
    tag: document.type || "Federal rulemaking",
  }));
}

async function getVietnamRegulation(): Promise<FeedItem[]> {
  const result = await fetchJson<{ docs?: VietnamDocument[] }>("https://vietnamlaw.gov.vn/api/vanbanmoi/public?limit=30");
  return (result.docs ?? [])
    .filter((document) => {
      const text = `${document.tenvb ?? ""} ${document.tomtat ?? ""} ${document.linhvuc_id?.[0]?.tenlinhvuc_en ?? ""}`.toLowerCase();
      return vietnamTopicTerms.some((term) => text.includes(term));
    })
    .map((document) => ({
      id: `vietnam-${document._id}`,
      source: "vietnam-regulation" as const,
      title: document.tenvb || document.mavb || "Vietnamese legal document",
      summary: shorten(document.tomtat || "Open this official document from Vietnam’s National Law Portal."),
      author: document.coquanbanhanh_id?.[0]?.tencoquan_en || "Vietnam National Law Portal",
      url: "https://vietnamlaw.gov.vn/",
      publishedAt: document.ngaycapnhat || document.ngaybanhanh || new Date().toISOString(),
      tag: document.linhvuc_id?.[0]?.tenlinhvuc_en || "Vietnam regulation",
    }));
}

async function getWorldBank(): Promise<FeedItem[]> {
  const result = await fetchJson<[unknown, WorldBankObservation[]]>("https://api.worldbank.org/v2/country/VNM;USA;WLD/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=15&date=2024:2026");
  return (result[1] ?? [])
    .filter((observation) => observation.value !== null && observation.value !== undefined)
    .map((observation) => ({
      id: `world-bank-${observation.countryiso3code}-${observation.date}`,
      source: "world-bank" as const,
      title: `${observation.country?.value || "Economy"}: GDP growth ${Number(observation.value).toFixed(1)}% in ${observation.date}`,
      summary: `${observation.indicator?.value || "Economic indicator"} from World Bank open data.`,
      author: "World Bank Data",
      url: "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG",
      publishedAt: `${observation.date || new Date().getFullYear()}-12-31T00:00:00.000Z`,
      score: Math.round(Number(observation.value) * 10),
      tag: "Global economy",
    }));
}

async function getBluesky(): Promise<FeedItem[]> {
  const actors = (process.env.BLUESKY_ACTORS || "bsky.app,jay.bsky.team,atproto.com")
    .split(",").map((actor) => actor.trim()).filter(Boolean).slice(0, 5);
  const feeds = await Promise.all(actors.map((actor) => fetchJson<{ feed: BlueskyPost[] }>(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(actor)}&limit=6`)));
  return feeds.flatMap((feed) => feed.feed).flatMap(({ post }) => {
    const text = stripHtml(post.record.text || "");
    if (!text) return [];
    return [{
      id: `bsky-${post.uri}`,
      source: "bluesky" as const,
      title: shorten(text, 112),
      summary: shorten(text),
      author: post.author.displayName || post.author.handle,
      authorHandle: `@${post.author.handle}`,
      url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split("/").pop()}`,
      publishedAt: post.record.createdAt,
      score: post.likeCount,
      comments: post.replyCount,
      tag: "Tech social",
    }];
  });
}

type LiveSourceId = Exclude<SourceId, "hashnode" | "discord" | "mastodon">;

const adapters: Record<LiveSourceId, () => Promise<FeedItem[]>> = {
  arxiv: getArxiv,
  "hacker-news": getHackerNews,
  github: getGitHubDiscussions,
  "stack-overflow": getStackOverflow,
  dev: getDev,
  "indie-hackers": getIndieHackers,
  "eu-regulation": getEuRegulation,
  "us-regulation": getUsRegulation,
  "vietnam-regulation": getVietnamRegulation,
  "world-bank": getWorldBank,
  bluesky: getBluesky,
};

function parseRequestedSources(requested: string | null): LiveSourceId[] {
  if (!requested || requested === "all") return Object.keys(adapters) as LiveSourceId[];
  const values = requested.split(",").filter((source): source is LiveSourceId => source in adapters);
  return values.length > 0 ? values : (Object.keys(adapters) as LiveSourceId[]);
}

export async function getFeed(requestedSources: string | null): Promise<FeedResponse> {
  const sources = parseRequestedSources(requestedSources);
  const settled = await Promise.allSettled(sources.map((source) => adapters[source]()));
  const statuses: SourceStatus[] = [];
  const items = settled.flatMap((result, index) => {
    const source = sources[index];
    if (result.status === "fulfilled") {
      statuses.push({ source, loaded: true });
      return result.value;
    }
    statuses.push({ source, loaded: false, message: result.reason instanceof Error ? result.reason.message : "Unavailable" });
    return [];
  });

  const balancedItems = Object.values(
    items.reduce<Partial<Record<SourceId, FeedItem[]>>>((groups, item) => {
      const group = groups[item.source] ?? [];
      group.push(item);
      groups[item.source] = group;
      return groups;
    }, {}),
  ).flatMap((sourceItems) => filterAndRank(sourceItems).slice(0, PER_SOURCE_LIMIT));

  return {
    items: filterAndRank(balancedItems).slice(0, 60),
    statuses,
    fetchedAt: new Date().toISOString(),
  };
}
