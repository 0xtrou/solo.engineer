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

const IndexPage = ({ data }) => {
  const reports = data.allMarkdownRemark.nodes;
  const categoryGroups = {};
  reports.forEach((r) => {
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
            <h2 className="section-title">📋 Recent Reports</h2>
            <div className="report-grid">
              {reports.slice(0, 30).map((report) => {
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
              })}
            </div>
          </section>
        </div>

        <div className="dashboard-sidebar">
          <DataPanel title="🗂 Categories">
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
          <DataPanel title="📊 Stats">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{reports.length}</span>
                <span className="stat-label">Reports</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{sortedCategories.length}</span>
                <span className="stat-label">Categories</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{reports[0]?.fields?.date || "—"}</span>
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
    allMarkdownRemark(
      filter: { fields: { category: { nin: ["agent-ops"] } } }
      sort: { fields: { date: DESC } }
      limit: 50
    ) {
      nodes {
        id
        fields {
          slug
          category
          categoryLabel
          categoryIcon
          date
          inferredTitle
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
