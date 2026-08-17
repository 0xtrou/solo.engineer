import type { SourceId, SourceTier } from "@/lib/types";

export type { SourceTier };

export type SourceMeta = {
  id: SourceId;
  label: string;
  accent: string;
  description: string;
  tier: SourceTier;
};

export const sourceMeta: Record<SourceId, SourceMeta> = {
  arxiv: { id: "arxiv", label: "arXiv AI", accent: "#b73c32", description: "New AI research papers", tier: "T1" },
  "hacker-news": { id: "hacker-news", label: "Hacker News", accent: "#f57227", description: "Curated technical discourse", tier: "T1" },
  github: { id: "github", label: "GitHub Discussions", accent: "#30363d", description: "Project knowledge from real codebases", tier: "T1" },
  "stack-overflow": { id: "stack-overflow", label: "Stack Overflow", accent: "#f48024", description: "Concrete technical questions and answers", tier: "T1" },
  dev: { id: "dev", label: "DEV Community", accent: "#3b49df", description: "Deep writing from working developers", tier: "T2" },
  "indie-hackers": { id: "indie-hackers", label: "Indie Hackers", accent: "#5547df", description: "Startup lessons and build logs", tier: "T2" },
  "eu-regulation": { id: "eu-regulation", label: "EU Tech Policy", accent: "#2456a6", description: "AI Act and digital policy", tier: "T1" },
  "us-regulation": { id: "us-regulation", label: "US Regulation", accent: "#b4433c", description: "Federal AI and technology rules", tier: "T1" },
  "vietnam-regulation": { id: "vietnam-regulation", label: "Vietnam Law", accent: "#be2632", description: "Official national legal documents", tier: "T1" },
  baochinhphu: { id: "baochinhphu", label: "Vietnam Gov Portal", accent: "#c8242c", description: "Government decrees and policy news", tier: "T1" },
  congbobanan: { id: "congbobanan", label: "Vietnam Court", accent: "#8b1e3f", description: "Supreme Court published judgments", tier: "T1" },
  "world-bank": { id: "world-bank", label: "Global Economy", accent: "#0a6f94", description: "World Bank indicators and outlooks", tier: "T1" },
  openalex: { id: "openalex", label: "OpenAlex", accent: "#5f5ff6", description: "Academic research across AI and technology", tier: "T1" },
  "hugging-face": { id: "hugging-face", label: "Hugging Face", accent: "#ff9d00", description: "Open AI research and model tooling", tier: "T1" },
  "microsoft-research": { id: "microsoft-research", label: "Microsoft Research", accent: "#0078d4", description: "Applied computer science research", tier: "T1" },
  "google-ai": { id: "google-ai", label: "Google AI", accent: "#4285f4", description: "Google AI research and product engineering", tier: "T1" },
  "mit-sloan": { id: "mit-sloan", label: "MIT Sloan Review", accent: "#a31f34", description: "Management research for founders and DBAs", tier: "T1" },
  "social-media-today": { id: "social-media-today", label: "Social Media Today", accent: "#00a7b5", description: "Social media strategy and administration", tier: "T2" },
  wikimedia: { id: "wikimedia", label: "Wikimedia", accent: "#3963a4", description: "Free knowledge and Wikimedia movement news", tier: "T1" },
  "creative-commons": { id: "creative-commons", label: "Creative Commons", accent: "#ef9421", description: "Open licenses, culture, and knowledge policy", tier: "T2" },
  "open-knowledge-foundation": { id: "open-knowledge-foundation", label: "Open Knowledge", accent: "#1d7f6e", description: "Open data and public-interest technology", tier: "T2" },
  openstreetmap: { id: "openstreetmap", label: "OpenStreetMap", accent: "#7aab4c", description: "Open mapping and geographic knowledge", tier: "T2" },
  "internet-archive": { id: "internet-archive", label: "Internet Archive", accent: "#36678f", description: "Universal access to digital knowledge", tier: "T1" },
  "learning-equality": { id: "learning-equality", label: "Learning Equality", accent: "#6d8e2f", description: "Offline learning and open education", tier: "T3" },
  carpentries: { id: "carpentries", label: "The Carpentries", accent: "#2f7e9e", description: "Open lessons for research computing", tier: "T3" },
  "public-knowledge-project": { id: "public-knowledge-project", label: "PKP", accent: "#684a91", description: "Open scholarly publishing infrastructure", tier: "T3" },
  "center-for-open-science": { id: "center-for-open-science", label: "Center for Open Science", accent: "#4f7da8", description: "Open and reproducible research", tier: "T3" },
  numfocus: { id: "numfocus", label: "NumFOCUS", accent: "#4b7795", description: "Open scientific computing and education", tier: "T2" },
  "open-source-ecology": { id: "open-source-ecology", label: "Open Source Ecology", accent: "#568847", description: "Open hardware and practical education", tier: "T3" },
  "open-education-global": { id: "open-education-global", label: "Open Education Global", accent: "#e06b35", description: "Open education policy and practice", tier: "T3" },
  oapen: { id: "oapen", label: "OAPEN", accent: "#855aa4", description: "Open-access academic books", tier: "T3" },
  "open-food-facts": { id: "open-food-facts", label: "Open Food Facts", accent: "#4c9c63", description: "Open food data and public knowledge", tier: "T3" },
  apereo: { id: "apereo", label: "Apereo", accent: "#8a6633", description: "Open-source higher education software", tier: "T3" },
  posit: { id: "posit", label: "Posit Open Source", accent: "#417ca8", description: "Open data science and technical publishing", tier: "T2" },
  moodle: { id: "moodle", label: "Moodle", accent: "#f98012", description: "Open-source learning platform", tier: "T2" },
  h5p: { id: "h5p", label: "H5P", accent: "#136c8f", description: "Open interactive learning content", tier: "T3" },
  "canvas-lms": { id: "canvas-lms", label: "Canvas LMS", accent: "#dd4b39", description: "Open-source learning platform releases", tier: "T3" },
  overleaf: { id: "overleaf", label: "Overleaf", accent: "#47a141", description: "Open collaborative scientific writing", tier: "T2" },
  pensoft: { id: "pensoft", label: "Pensoft", accent: "#5f963f", description: "Open-science publishing news", tier: "T2" },
  frontiers: { id: "frontiers", label: "Frontiers", accent: "#0b8786", description: "Open-access research publishing", tier: "T1" },
  automattic: { id: "automattic", label: "Automattic", accent: "#2372a3", description: "Open-source publishing and web tooling", tier: "T2" },
  proton: { id: "proton", label: "Proton", accent: "#6d4aff", description: "Open-source privacy technology", tier: "T2" },
  plausible: { id: "plausible", label: "Plausible", accent: "#4f46e5", description: "Open-source privacy analytics", tier: "T2" },
  matomo: { id: "matomo", label: "Matomo", accent: "#3157a5", description: "Open-source analytics and data ownership", tier: "T2" },
  mastodon: { id: "mastodon", label: "Mastodon", accent: "#6364ff", description: "Federated public conversation", tier: "T3" },
  bluesky: { id: "bluesky", label: "Bluesky", accent: "#1686d9", description: "Curated technical public posting", tier: "T3" },
  hashnode: { id: "hashnode", label: "Hashnode", accent: "#2962ff", description: "Developer publishing and discoveries", tier: "T3" },
  discord: { id: "discord", label: "Discord", accent: "#5865f2", description: "Private channels via optional local config", tier: "T3" },
};

export const sourceIds = Object.keys(sourceMeta) as SourceId[];
