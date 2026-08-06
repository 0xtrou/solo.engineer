import type { FeedItem, FeedResponse, SourceId } from "@/lib/types";

const fixtureTimestamp = "2026-08-06T00:00:00.000Z";

const fixtureItems: FeedItem[] = [
  { id: "fixture-arxiv", source: "arxiv", title: "Agentic systems for reliable public infrastructure", summary: "Research on robust AI agents for science, policy, and production systems.", author: "arXiv AI", url: "https://arxiv.org/", publishedAt: fixtureTimestamp, score: 96, tag: "AI research" },
  { id: "fixture-hacker-news", source: "hacker-news", title: "Open source AI developer tools earn attention", summary: "Builder discussion covering model infrastructure and practical engineering tradeoffs.", author: "Hacker News", url: "https://news.ycombinator.com/", publishedAt: fixtureTimestamp, score: 88, comments: 42, tag: "Technology" },
  { id: "fixture-github", source: "github", title: "Discussion: operating agent workflows in production", summary: "Project maintainers share implementation patterns for AI agents and reliable deployment.", author: "GitHub Discussions", url: "https://github.com/discussions", publishedAt: fixtureTimestamp, score: 79, comments: 19, tag: "Open source" },
  { id: "fixture-stack-overflow", source: "stack-overflow", title: "How should teams evaluate an AI agent pipeline?", summary: "Concrete technical questions about model evaluation, observability, and software quality.", author: "Stack Overflow", url: "https://stackoverflow.com/", publishedAt: fixtureTimestamp, score: 67, comments: 12, tag: "Software" },
  { id: "fixture-dev", source: "dev", title: "Building SOTA AI features with responsible defaults", summary: "Developer writing on product architecture, model safety, and practical data workflows.", author: "DEV Community", url: "https://dev.to/", publishedAt: fixtureTimestamp, score: 54, comments: 8, tag: "AI" },
  { id: "fixture-indie-hackers", source: "indie-hackers", title: "A repeatable business growth system for AI products", summary: "A founder report on customer discovery, growth experiments, and sustainable operations.", author: "Indie Hackers", url: "https://www.indiehackers.com/", publishedAt: fixtureTimestamp, score: 48, comments: 11, tag: "Business growth" },
  { id: "fixture-bluesky", source: "bluesky", title: "Technology governance needs better social administration", summary: "Public conversation on AI governance, public administration, and digital services.", author: "Bluesky", url: "https://bsky.app/", publishedAt: fixtureTimestamp, score: 40, comments: 7, tag: "Tech social" },
  { id: "fixture-eu", source: "eu-regulation", title: "EU AI Act compliance guidance for high-risk systems", summary: "European policy update covering AI governance, transparency, and compliance deadlines.", author: "European Commission", url: "https://digital-strategy.ec.europa.eu/", publishedAt: fixtureTimestamp, score: 91, tag: "EU tech policy" },
  { id: "fixture-us", source: "us-regulation", title: "US technology regulation update for AI procurement", summary: "Federal policy material on accountable AI, cybersecurity, and public-sector technology.", author: "US Federal Register", url: "https://www.federalregister.gov/", publishedAt: fixtureTimestamp, score: 86, tag: "US regulation" },
  { id: "fixture-vietnam", source: "vietnam-regulation", title: "Vietnam digital government and technology regulation", summary: "Official Vietnamese policy signals for digital economy, social administration, and compliance.", author: "Vietnam Law", url: "https://vbpl.vn/", publishedAt: fixtureTimestamp, score: 83, tag: "Vietnam regulation" },
  { id: "fixture-world-bank", source: "world-bank", title: "Global economy: resilient technology investment outlook", summary: "World Bank data context for growth, trade, investment, and global economic compliance.", author: "World Bank", url: "https://www.worldbank.org/", publishedAt: fixtureTimestamp, score: 76, tag: "Global economy" },
];

export function getE2eFeed(sources: SourceId[]): FeedResponse {
  const sourceSet = new Set(sources);
  return {
    items: fixtureItems.filter((item) => sourceSet.has(item.source)),
    statuses: sources.map((source) => ({ source, loaded: true })),
    fetchedAt: fixtureTimestamp,
  };
}
