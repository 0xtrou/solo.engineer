import { categorizeArticleKeyword } from "@/lib/categories";
import { filterAndRank } from "@/lib/topics";
import { getE2eFeed } from "@/lib/feed-fixtures";
import { sourceMeta } from "@/lib/source-meta";
import type { FeedItem, FeedResponse, SourceId, SourceStatus } from "@/lib/types";

const REVALIDATE_SECONDS = 600;
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
type OpenAlexWork = {
  id: string;
  display_name?: string;
  publication_date?: string;
  cited_by_count?: number;
  type?: string;
  primary_location?: { landing_page_url?: string; source?: { display_name?: string } };
  authorships?: Array<{ author?: { display_name?: string } }>;
  concepts?: Array<{ display_name?: string }>;
};

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

function xmlAttribute(value: string | undefined, attribute: string): string | undefined {
  return value?.match(new RegExp(`\\b${attribute}=["']([^"']+)["']`, "i"))?.[1];
}

function xmlLink(xml: string): string {
  const tag = xml.match(/<link\b[^>]*>/i)?.[0];
  return xmlAttribute(tag, "href") || stripCdata(xmlValue(xml, "link"));
}

function parseRssItems(xml: string) {
  const rssItems = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match, index) => {
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

  if (rssItems.length > 0) return rssItems;

  return [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/g)].map((match, index) => {
    const entry = match[1];
    const author = xmlValue(entry, "author");
    const categoryTag = entry.match(/<category\b[^>]*>/i)?.[0];
    return {
      id: stripCdata(xmlValue(entry, "id")) || `${xmlLink(entry) || "entry"}-${index}`,
      title: stripHtml(stripCdata(xmlValue(entry, "title"))),
      link: xmlLink(entry),
      description: stripHtml(stripCdata(xmlValue(entry, "summary")) || stripCdata(xmlValue(entry, "content"))),
      author: stripHtml(stripCdata(xmlValue(author || "", "name"))),
      publishedAt: stripCdata(xmlValue(entry, "published")) || stripCdata(xmlValue(entry, "updated")),
      category: xmlAttribute(categoryTag, "term"),
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

function rssItemsToFeedItems(entries: ReturnType<typeof parseRssItems>, source: SourceId, fallbackAuthor: string, fallbackSummary: string, fallbackTag: string): FeedItem[] {
  return entries
    .filter((entry) => entry.title && entry.link)
    .map((entry) => ({
      id: `${source}-${entry.id}`,
      source,
      title: entry.title,
      summary: shorten(entry.description || fallbackSummary),
      author: entry.author || fallbackAuthor,
      url: entry.link,
      publishedAt: entry.publishedAt || new Date().toISOString(),
      tag: entry.category || fallbackTag,
    }));
}

async function getOpenAlex(): Promise<FeedItem[]> {
  const result = await fetchJson<{ results: OpenAlexWork[] }>("https://api.openalex.org/works?search=artificial%20intelligence&sort=publication_date:desc&per-page=20");
  return result.results
    .filter((work) => work.display_name && work.primary_location?.landing_page_url)
    .map((work) => ({
      id: `openalex-${work.id}`,
      source: "openalex" as const,
      title: work.display_name || "Untitled academic work",
      summary: shorten(`OpenAlex record for ${work.primary_location?.source?.display_name || "an academic publication"}.`),
      author: work.authorships?.map((authorship) => authorship.author?.display_name).filter((name): name is string => Boolean(name)).slice(0, 3).join(", ") || "OpenAlex authors",
      url: work.primary_location?.landing_page_url || work.id,
      publishedAt: work.publication_date ? `${work.publication_date}T00:00:00.000Z` : new Date().toISOString(),
      score: work.cited_by_count,
      tag: work.concepts?.[0]?.display_name || work.type || "Academic research",
    }));
}

async function getHuggingFace(): Promise<FeedItem[]> {
  return rssItemsToFeedItems(await fetchRss("https://huggingface.co/blog/feed.xml"), "hugging-face", "Hugging Face", "Open this Hugging Face research or tooling update.", "AI engineering");
}

async function getMicrosoftResearch(): Promise<FeedItem[]> {
  return rssItemsToFeedItems(await fetchRss("https://www.microsoft.com/en-us/research/feed/"), "microsoft-research", "Microsoft Research", "Open this Microsoft Research publication.", "Computer science");
}

async function getGoogleAi(): Promise<FeedItem[]> {
  return rssItemsToFeedItems(await fetchRss("https://blog.google/technology/ai/rss/"), "google-ai", "Google AI", "Open this Google AI research or engineering update.", "AI technology");
}

async function getMitSloan(): Promise<FeedItem[]> {
  return rssItemsToFeedItems(await fetchRss("https://sloanreview.mit.edu/feed/"), "mit-sloan", "MIT Sloan Management Review", "Open this management research article.", "Management research");
}

async function getSocialMediaToday(): Promise<FeedItem[]> {
  return rssItemsToFeedItems(await fetchRss("https://www.socialmediatoday.com/feeds/news/"), "social-media-today", "Social Media Today", "Open this social media administration update.", "Social media administration");
}

function getOrganizationFeed(source: SourceId, endpoint: string, author: string, summary: string, tag: string): Promise<FeedItem[]> {
  return fetchRss(endpoint).then((entries) => rssItemsToFeedItems(entries, source, author, summary, tag));
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
  openalex: getOpenAlex,
  "hugging-face": getHuggingFace,
  "microsoft-research": getMicrosoftResearch,
  "google-ai": getGoogleAi,
  "mit-sloan": getMitSloan,
  "social-media-today": getSocialMediaToday,
  wikimedia: () => getOrganizationFeed("wikimedia", "https://wikimediafoundation.org/feed/", "Wikimedia Foundation", "Open this free-knowledge update from the Wikimedia movement.", "Free knowledge"),
  "creative-commons": () => getOrganizationFeed("creative-commons", "https://creativecommons.org/feed/", "Creative Commons", "Open this update on sharing, culture, or open knowledge.", "Open knowledge"),
  "open-knowledge-foundation": () => getOrganizationFeed("open-knowledge-foundation", "https://blog.okfn.org/feed/", "Open Knowledge Foundation", "Open this public-interest data or technology update.", "Open data"),
  openstreetmap: () => getOrganizationFeed("openstreetmap", "https://blog.openstreetmap.org/feed/", "OpenStreetMap", "Open this community mapping update.", "Open mapping"),
  "internet-archive": () => getOrganizationFeed("internet-archive", "https://blog.archive.org/feed/", "Internet Archive", "Open this update on preserving and accessing knowledge.", "Digital library"),
  "learning-equality": () => getOrganizationFeed("learning-equality", "https://learning-equality.medium.com/feed", "Learning Equality", "Open this offline learning and open education update.", "Open education"),
  carpentries: () => getOrganizationFeed("carpentries", "https://carpentries.org/blog/index.xml", "The Carpentries", "Open this research computing and open lesson update.", "Open education"),
  "public-knowledge-project": () => getOrganizationFeed("public-knowledge-project", "https://pkp.sfu.ca/feed/", "Public Knowledge Project", "Open this scholarly publishing infrastructure update.", "Open access"),
  "center-for-open-science": () => getOrganizationFeed("center-for-open-science", "https://www.cos.io/blog/rss.xml", "Center for Open Science", "Open this reproducible research update.", "Open science"),
  numfocus: () => getOrganizationFeed("numfocus", "https://medium.com/feed/@numfocus", "NumFOCUS", "Open this scientific computing community update.", "Scientific computing"),
  "open-source-ecology": () => getOrganizationFeed("open-source-ecology", "https://www.opensourceecology.org/feed/", "Open Source Ecology", "Open this practical open hardware and education update.", "Open hardware"),
  "open-education-global": () => getOrganizationFeed("open-education-global", "https://www.oeglobal.org/feed/", "Open Education Global", "Open this global open education update.", "Open education"),
  oapen: () => getOrganizationFeed("oapen", "https://library.oapen.org/feed/rss_2.0/site", "OAPEN Library", "Open this open-access academic book update.", "Open access"),
  "open-food-facts": () => getOrganizationFeed("open-food-facts", "https://blog.openfoodfacts.org/en/feed", "Open Food Facts", "Open this open food data update.", "Open data"),
  apereo: () => getOrganizationFeed("apereo", "https://www.apereo.org/rss.xml", "Apereo Foundation", "Open this higher education open-source update.", "Open education"),
  posit: () => getOrganizationFeed("posit", "https://opensource.posit.co/blog/index.xml", "Posit", "Open this open-source data science update.", "Open source"),
  moodle: () => getOrganizationFeed("moodle", "https://moodle.com/feed/", "Moodle", "Open this learning platform update.", "Open education"),
  h5p: () => getOrganizationFeed("h5p", "https://h5p.org/rss.xml", "H5P", "Open this interactive learning content update.", "Open education"),
  "canvas-lms": () => getOrganizationFeed("canvas-lms", "https://github.com/instructure/canvas-lms/releases.atom", "Canvas LMS", "Open this Canvas LMS release update.", "Open source"),
  overleaf: () => getOrganizationFeed("overleaf", "https://github.com/overleaf/overleaf/releases.atom", "Overleaf", "Open this collaborative writing release update.", "Open source"),
  pensoft: () => getOrganizationFeed("pensoft", "https://blog.pensoft.net/feed/", "Pensoft", "Open this open-science publishing update.", "Open access"),
  frontiers: () => getOrganizationFeed("frontiers", "https://www.frontiersin.org/news/rss", "Frontiers", "Open this open-access research update.", "Open access"),
  automattic: () => getOrganizationFeed("automattic", "https://automattic.com/feed/", "Automattic", "Open this open-source publishing and web update.", "Open source"),
  proton: () => getOrganizationFeed("proton", "https://proton.me/blog/feed", "Proton", "Open this privacy and open-source technology update.", "Privacy technology"),
  plausible: () => getOrganizationFeed("plausible", "https://plausible.io/blog/feed.xml", "Plausible", "Open this privacy-friendly analytics update.", "Open source"),
  matomo: () => getOrganizationFeed("matomo", "https://matomo.org/feed/", "Matomo", "Open this data ownership and open-source analytics update.", "Open source"),
};

function parseRequestedSources(requested: string | null): LiveSourceId[] {
  if (!requested || requested === "all") return Object.keys(adapters) as LiveSourceId[];
  const values = requested.split(",").filter((source): source is LiveSourceId => source in adapters);
  return values.length > 0 ? values : (Object.keys(adapters) as LiveSourceId[]);
}

async function settleWithConcurrency<T>(tasks: Array<() => Promise<T>>, concurrency = 4): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = { status: "fulfilled", value: await tasks[index]() };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  return results;
}

export async function getFeedSnapshot(requestedSources: string | null): Promise<FeedResponse> {
  const sources = parseRequestedSources(requestedSources);
  if (process.env.E2E === "1") return getE2eFeed(sources);
  const settled = await settleWithConcurrency(sources.map((source) => adapters[source]), 4);
  const statuses: SourceStatus[] = [];
  const items = settled.flatMap((result, index) => {
    const source = sources[index];
    if (result.status === "fulfilled") {
      statuses.push({ source, loaded: true });
      return result.value;
    }
    statuses.push({ source, loaded: false, message: result.reason instanceof Error ? result.reason.message : "Unavailable" });
    return [];
  }).map((item) => {
    const { scores } = categorizeArticleKeyword(item.title, item.summary, "Technology & research");
    return { ...item, tier: sourceMeta[item.source]?.tier, categoryScores: scores };
  });

  return { items, statuses, fetchedAt: new Date().toISOString() };
}

const FEED_LIMIT = 240;
const GUARANTEED_PER_SOURCE = 2;

export async function getFeed(requestedSources: string | null): Promise<FeedResponse> {
  const snapshot = await getFeedSnapshot(requestedSources);

  const rankedBySource = Object.values(
    snapshot.items.reduce<Partial<Record<SourceId, FeedItem[]>>>((groups, item) => {
      const group = groups[item.source] ?? [];
      group.push(item);
      groups[item.source] = group;
      return groups;
    }, {}),
  ).flatMap((sourceItems) => filterAndRank(sourceItems).slice(0, PER_SOURCE_LIMIT));

  // Guarantee coverage: top N items per source always survive, so every live source appears.
  // Vietnam-regulation and world-bank (low infra-keyword scores but high editorial value)
  // would otherwise be crowded out by score-sort.
  const guaranteed: FeedItem[] = [];
  const remaining: FeedItem[] = [];
  const takenPerSource = new Map<string, number>();
  const ranked = filterAndRank(rankedBySource);
  for (const item of ranked) {
    const taken = takenPerSource.get(item.source) ?? 0;
    if (taken < GUARANTEED_PER_SOURCE) {
      guaranteed.push(item);
      takenPerSource.set(item.source, taken + 1);
    } else {
      remaining.push(item);
    }
  }
  const items = [...guaranteed, ...remaining].slice(0, FEED_LIMIT);

  return {
    items,
    statuses: snapshot.statuses,
    fetchedAt: snapshot.fetchedAt,
  };
}
