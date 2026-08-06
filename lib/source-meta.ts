import type { SourceId } from "@/lib/types";

export type SourceMeta = {
  id: SourceId;
  label: string;
  accent: string;
  description: string;
};

export const sourceMeta: Record<SourceId, SourceMeta> = {
  arxiv: { id: "arxiv", label: "arXiv AI", accent: "#b73c32", description: "New AI research papers" },
  "hacker-news": { id: "hacker-news", label: "Hacker News", accent: "#f57227", description: "Curated technical discourse" },
  github: { id: "github", label: "GitHub Discussions", accent: "#30363d", description: "Project knowledge from real codebases" },
  "stack-overflow": { id: "stack-overflow", label: "Stack Overflow", accent: "#f48024", description: "Concrete technical questions and answers" },
  dev: { id: "dev", label: "DEV Community", accent: "#3b49df", description: "Deep writing from working developers" },
  "indie-hackers": { id: "indie-hackers", label: "Indie Hackers", accent: "#5547df", description: "Startup lessons and build logs" },
  "eu-regulation": { id: "eu-regulation", label: "EU Tech Policy", accent: "#2456a6", description: "AI Act and digital policy" },
  "us-regulation": { id: "us-regulation", label: "US Regulation", accent: "#b4433c", description: "Federal AI and technology rules" },
  "vietnam-regulation": { id: "vietnam-regulation", label: "Vietnam Law", accent: "#be2632", description: "Official national legal documents" },
  "world-bank": { id: "world-bank", label: "Global Economy", accent: "#0a6f94", description: "World Bank indicators and outlooks" },
  openalex: { id: "openalex", label: "OpenAlex", accent: "#5f5ff6", description: "Academic research across AI and technology" },
  "hugging-face": { id: "hugging-face", label: "Hugging Face", accent: "#ff9d00", description: "Open AI research and model tooling" },
  "microsoft-research": { id: "microsoft-research", label: "Microsoft Research", accent: "#0078d4", description: "Applied computer science research" },
  "google-ai": { id: "google-ai", label: "Google AI", accent: "#4285f4", description: "Google AI research and product engineering" },
  "mit-sloan": { id: "mit-sloan", label: "MIT Sloan Review", accent: "#a31f34", description: "Management research for founders and DBAs" },
  "social-media-today": { id: "social-media-today", label: "Social Media Today", accent: "#00a7b5", description: "Social media strategy and administration" },
  wikimedia: { id: "wikimedia", label: "Wikimedia", accent: "#3963a4", description: "Free knowledge and Wikimedia movement news" },
  "creative-commons": { id: "creative-commons", label: "Creative Commons", accent: "#ef9421", description: "Open licenses, culture, and knowledge policy" },
  "open-knowledge-foundation": { id: "open-knowledge-foundation", label: "Open Knowledge", accent: "#1d7f6e", description: "Open data and public-interest technology" },
  openstreetmap: { id: "openstreetmap", label: "OpenStreetMap", accent: "#7aab4c", description: "Open mapping and geographic knowledge" },
  "internet-archive": { id: "internet-archive", label: "Internet Archive", accent: "#36678f", description: "Universal access to digital knowledge" },
  "learning-equality": { id: "learning-equality", label: "Learning Equality", accent: "#6d8e2f", description: "Offline learning and open education" },
  carpentries: { id: "carpentries", label: "The Carpentries", accent: "#2f7e9e", description: "Open lessons for research computing" },
  "public-knowledge-project": { id: "public-knowledge-project", label: "PKP", accent: "#684a91", description: "Open scholarly publishing infrastructure" },
  "center-for-open-science": { id: "center-for-open-science", label: "Center for Open Science", accent: "#4f7da8", description: "Open and reproducible research" },
  numfocus: { id: "numfocus", label: "NumFOCUS", accent: "#4b7795", description: "Open scientific computing and education" },
  "open-source-ecology": { id: "open-source-ecology", label: "Open Source Ecology", accent: "#568847", description: "Open hardware and practical education" },
  "open-education-global": { id: "open-education-global", label: "Open Education Global", accent: "#e06b35", description: "Open education policy and practice" },
  oapen: { id: "oapen", label: "OAPEN", accent: "#855aa4", description: "Open-access academic books" },
  "open-food-facts": { id: "open-food-facts", label: "Open Food Facts", accent: "#4c9c63", description: "Open food data and public knowledge" },
  osgeo: { id: "osgeo", label: "OSGeo", accent: "#406e8e", description: "Open-source geospatial software and education" },
  apereo: { id: "apereo", label: "Apereo", accent: "#8a6633", description: "Open-source higher education software" },
  posit: { id: "posit", label: "Posit Open Source", accent: "#417ca8", description: "Open data science and technical publishing" },
  moodle: { id: "moodle", label: "Moodle", accent: "#f98012", description: "Open-source learning platform" },
  h5p: { id: "h5p", label: "H5P", accent: "#136c8f", description: "Open interactive learning content" },
  "canvas-lms": { id: "canvas-lms", label: "Canvas LMS", accent: "#dd4b39", description: "Open-source learning platform releases" },
  overleaf: { id: "overleaf", label: "Overleaf", accent: "#47a141", description: "Open collaborative scientific writing" },
  pensoft: { id: "pensoft", label: "Pensoft", accent: "#5f963f", description: "Open-science publishing news" },
  frontiers: { id: "frontiers", label: "Frontiers", accent: "#0b8786", description: "Open-access research publishing" },
  automattic: { id: "automattic", label: "Automattic", accent: "#2372a3", description: "Open-source publishing and web tooling" },
  proton: { id: "proton", label: "Proton", accent: "#6d4aff", description: "Open-source privacy technology" },
  plausible: { id: "plausible", label: "Plausible", accent: "#4f46e5", description: "Open-source privacy analytics" },
  matomo: { id: "matomo", label: "Matomo", accent: "#3157a5", description: "Open-source analytics and data ownership" },
  mastodon: { id: "mastodon", label: "Mastodon", accent: "#6364ff", description: "Federated public conversation" },
  bluesky: { id: "bluesky", label: "Bluesky", accent: "#1686d9", description: "Curated technical public posting" },
  hashnode: { id: "hashnode", label: "Hashnode", accent: "#2962ff", description: "Developer publishing and discoveries" },
  discord: { id: "discord", label: "Discord", accent: "#5865f2", description: "Private channels via optional local config" },
};

export const sourceIds = Object.keys(sourceMeta) as SourceId[];
