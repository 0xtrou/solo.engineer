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
  mastodon: { id: "mastodon", label: "Mastodon", accent: "#6364ff", description: "Federated public conversation" },
  bluesky: { id: "bluesky", label: "Bluesky", accent: "#1686d9", description: "Curated technical public posting" },
  hashnode: { id: "hashnode", label: "Hashnode", accent: "#2962ff", description: "Developer publishing and discoveries" },
  discord: { id: "discord", label: "Discord", accent: "#5865f2", description: "Private channels via optional local config" },
};

export const sourceIds = Object.keys(sourceMeta) as SourceId[];
