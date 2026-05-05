import React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import DataPanel from "../components/DataPanel";

const AboutPage = () => {
  const agents = [
    { name: "Global Intel & Crypto Analyst", icon: "🌐", schedule: "07:00 SGT", desc: "Daily crypto market intelligence and macro signals" },
    { name: "Trend Analyst", icon: "🔍", schedule: "08:00 SGT", desc: "GitHub, ProductHunt, and emerging tech trends" },
    { name: "VN Legal Eagle", icon: "⚖️", schedule: "09:00 SGT", desc: "Vietnamese legal and regulatory monitoring" },
    { name: "Product Engineer", icon: "🛠️", schedule: "10:00 SGT", desc: "AI SaaS clone feasibility and opportunity scoring" },
    { name: "Crypto Catalyst Sentinel", icon: "⚡", schedule: "Every 8h", desc: "Macro event tracking for crypto markets" },
    { name: "Agent Ops Monitor", icon: "🤖", schedule: "Every 4h", desc: "Fleet health monitoring and self-healing" },
    { name: "Dataset Marketplace Analyst", icon: "📊", schedule: "11:00 SGT", desc: "Data-as-asset market intelligence" },
    { name: "Bobbie", icon: "⚡", schedule: "Always On", desc: "Multi-agent orchestrator. Routes, dispatches, delivers." },
  ];

  return (
    <Layout>
      <div className="page-header">
        <h1>About solo.engineer</h1>
        <p className="page-subtitle">A Bloomberg Terminal for the solo developer economy</p>
      </div>

      <div className="about-grid">
        <DataPanel title="🎯 Mission">
          <p>
            solo.engineer is an autonomous intelligence platform that runs a fleet of AI agents
            to produce daily reports on crypto markets, tech trends, Vietnamese regulations,
            and solo developer opportunities. This terminal is the frontend — a Bloomberg-style
            dashboard to consume that intelligence.
          </p>
        </DataPanel>

        <DataPanel title="🏗️ Tech Stack">
          <ul className="tech-list">
            <li><strong>Gatsby 5</strong> — Static site generation, React-based</li>
            <li><strong>TypeScript</strong> — Type-safe development</li>
            <li><strong>OpenClaw</strong> — Multi-agent orchestration runtime</li>
            <li><strong>Markdown Reports</strong> — All data sourced from agent-generated markdown</li>
            <li><strong>Dark Theme</strong> — Bloomberg terminal aesthetic</li>
            <li><strong>Static Hosting</strong> — No server, no API, no tracking</li>
          </ul>
        </DataPanel>

        <DataPanel title="🤖 Agent Fleet">
          <div className="agent-grid">
            {agents.map((agent) => (
              <div key={agent.name} className="agent-card">
                <div className="agent-icon">{agent.icon}</div>
                <div className="agent-info">
                  <strong>{agent.name}</strong>
                  <span className="agent-schedule">{agent.schedule}</span>
                  <p>{agent.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </DataPanel>

        <DataPanel title="📜 Principles">
          <ul className="principles-list">
            <li>No external API calls — all data is static from markdown</li>
            <li>No cookies, no tracking, no analytics</li>
            <li>No authentication — public intelligence</li>
            <li>Fast: static HTML, minimal JS</li>
            <li>Mobile-first, Bloomberg aesthetic</li>
          </ul>
        </DataPanel>
      </div>
    </Layout>
  );
};

export default AboutPage;

export const Head = () => (
  <SEO
    title="About — solo.engineer Terminal"
    description="Learn about solo.engineer: an autonomous intelligence platform with AI agents producing daily reports on crypto, trends, legal, and opportunities."
    path="/about/"
  />
);
