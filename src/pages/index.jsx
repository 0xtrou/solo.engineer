import React from "react";
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import MarketTicker from "../components/MarketTicker";
import ReportCard from "../components/ReportCard";
import SignalHeatmap from "../components/SignalHeatmap";
import DataPanel from "../components/DataPanel";

const CATEGORY_META = {
  "world-crypto": { label: "Global Crypto Intelligence", icon: "🌐", color: "#8B5CF6" },
  "trend-scout": { label: "Trend Scout", icon: "🔍", color: "#10B981" },
  "vn-legal-watch": { label: "Vietnam Legal Watch", icon: "⚖️", color: "#F59E0B" },
  "product-engineer": { label: "Product Engineer", icon: "🛠️", color: "#0066CC" },
  "crypto-catalyst": { label: "Crypto Catalyst Sentinel", icon: "⚡", color: "#FF4500" },
  "dataset-marketplace": { label: "Dataset Marketplace", icon: "📊", color: "#6366F1" },
  "concept-monetizer": { label: "Concept Monetizer", icon: "💰", color: "#22C55E" },
};

function getCategoryMeta(category) {
  return CATEGORY_META[category] || { label: category, icon: "📄", color: "#888888" };
}

function renderReportCard(report) {
  const meta = getCategoryMeta(report.fields?.category || "");
  const title = report.frontmatter?.title
    || report.fields?.inferredTitle
    || `${meta.label} — ${report.fields?.date || "Report"}`;
  return (
    <ReportCard
      key={report.id}
      slug={report.fields?.slug || ""}
      category={report.fields?.category || ""}
      date={report.fields?.date || ""}
      title={title}
      excerpt={report.excerpt || ""}
      icon={meta.icon}
      color={meta.color}
    />
  );
}

const IndexPage = ({ data }) => {
  const reports = data.allMarkdownRemark.nodes;

  // Split daily vs on-demand
  const dailyReports = reports.filter((r) => r.fields?.reportType !== "on-demand");
  const onDemandReports = reports.filter((r) => r.fields?.reportType === "on-demand");

  // Category groups (daily only for sidebar)
  const categoryGroups = {};
  dailyReports.forEach((r) => {
    const cat = r.fields?.category || "uncategorized";
    if (!categoryGroups[cat]) categoryGroups[cat] = [];
    categoryGroups[cat].push(r);
  });

  const sortedCategories = Object.entries(categoryGroups).sort(([, a], [, b]) => b.length - a.length);

  return (
    <Layout>
      <MarketTicker />
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="dashboard-section">
            <h2 className="section-title">📡 Latest Intelligence</h2>
            <SignalHeatmap categories={sortedCategories} getCategoryMeta={getCategoryMeta} />
          </section>

          <section className="dashboard-section">
            <h2 className="section-title">📋 Daily Reports</h2>
            <p className="section-subtitle">Automated daily intelligence from 7 analyst agents</p>
            <div className="report-grid">
              {dailyReports.slice(0, 20).map(renderReportCard)}
            </div>
          </section>

          {onDemandReports.length > 0 && (
            <section className="dashboard-section on-demand-section">
              <h2 className="section-title">🎯 On-Demand Analysis</h2>
              <p className="section-subtitle">Deep-dive research reports generated on request</p>
              <div className="report-grid">
                {onDemandReports.slice(0, 20).map(renderReportCard)}
              </div>
            </section>
          )}
        </div>

        <div className="dashboard-sidebar">
          <DataPanel title="🗂 Daily Categories">
            <ul className="category-list">
              {sortedCategories.map(([cat, items]) => {
                const meta = getCategoryMeta(cat);
                return (
                  <li key={cat}>
                    <a href={`/reports/${cat}/`} className="category-link">
                      <span className="cat-icon">{meta.icon}</span>
                      <span className="cat-label">{meta.label}</span>
                      <span className="cat-count">{items.length}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </DataPanel>

          {onDemandReports.length > 0 && (
            <DataPanel title="🎯 On-Demand Reports">
              <ul className="category-list">
                {onDemandReports.slice(0, 10).map((report) => {
                  const meta = getCategoryMeta(report.fields?.category || "");
                  const title = report.frontmatter?.title
                    || report.fields?.inferredTitle
                    || "Analysis";
                  return (
                    <li key={report.id}>
                      <a href={report.fields?.slug || "#"} className="category-link">
                        <span className="cat-icon">{meta.icon}</span>
                        <span className="cat-label" title={title}>{title.length > 35 ? title.substring(0, 35) + "…" : title}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </DataPanel>
          )}

          <DataPanel title="📊 Stats">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{reports.length}</span>
                <span className="stat-label">Total Reports</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{dailyReports.length}</span>
                <span className="stat-label">Daily</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{onDemandReports.length}</span>
                <span className="stat-label">On-Demand</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{dailyReports[0]?.fields?.date || "—"}</span>
                <span className="stat-label">Latest</span>
              </div>
            </div>
          </DataPanel>
        </div>
      </div>
    </Layout>
  );
};

export default IndexPage;

export const Head = ({ data }) => (
  <SEO
    title="solo.engineer — Terminal"
    description="Bloomberg Terminal-style intelligence dashboard for solo developers. Crypto signals, trend analysis, legal intelligence, and opportunity radar."
    path="/"
  />
);

export const query = graphql`
  query IndexPage {
    allMarkdownRemark(sort: { fields: { date: DESC } }) {
      nodes {
        id
        fields {
          slug
          category
          categoryLabel
          categoryIcon
          date
          inferredTitle
          reportType
        }
        frontmatter {
          title
          date
        }
        excerpt
      }
    }
  }
`;
