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
  { id: "fixture-openalex", source: "openalex", title: "PhD research on reliable AI agents", summary: "Peer-reviewed academic work on AI systems, scientific methods, and public infrastructure.", author: "OpenAlex authors", url: "https://openalex.org/", publishedAt: fixtureTimestamp, score: 98, tag: "Academic research" },
  { id: "fixture-hugging-face", source: "hugging-face", title: "Open model tooling for production AI teams", summary: "Research and engineering notes for model development, evaluation, and deployment.", author: "Hugging Face", url: "https://huggingface.co/blog", publishedAt: fixtureTimestamp, score: 93, tag: "AI engineering" },
  { id: "fixture-microsoft-research", source: "microsoft-research", title: "Computer science research for trustworthy AI", summary: "Applied research in AI, systems, security, and scientific computing.", author: "Microsoft Research", url: "https://www.microsoft.com/en-us/research/", publishedAt: fixtureTimestamp, score: 89, tag: "Computer science" },
  { id: "fixture-google-ai", source: "google-ai", title: "Google AI research and responsible deployment", summary: "AI research, model capabilities, and engineering practices from Google.", author: "Google AI", url: "https://blog.google/technology/ai/", publishedAt: fixtureTimestamp, score: 86, tag: "AI technology" },
  { id: "fixture-mit-sloan", source: "mit-sloan", title: "DBA leadership: scaling AI-enabled organizations", summary: "Management research on technology strategy, innovation, operations, and executive decision-making.", author: "MIT Sloan Management Review", url: "https://sloanreview.mit.edu/", publishedAt: fixtureTimestamp, score: 84, tag: "Management research" },
  { id: "fixture-social-media-today", source: "social-media-today", title: "Social media administration for technology organizations", summary: "Platform governance, communications operations, policy, and social media management.", author: "Social Media Today", url: "https://www.socialmediatoday.com/", publishedAt: fixtureTimestamp, score: 80, tag: "Social media administration" },
];

export function getE2eFeed(sources: SourceId[]): FeedResponse {
  const sourceSet = new Set(sources);
  return {
    items: fixtureItems.filter((item) => sourceSet.has(item.source)),
    statuses: sources.map((source) => ({ source, loaded: true })),
    fetchedAt: fixtureTimestamp,
  };
}
