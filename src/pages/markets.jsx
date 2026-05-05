import React from "react";
import { Link, graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
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

const CATEGORY_ORDER = [
  "world-crypto", "trend-scout", "vn-legal-watch", "product-engineer",
  "crypto-catalyst", "dataset-marketplace", "concept-monetizer",
];

function getMeta(cat) {
  return CATEGORY_META[cat] || { label: cat, icon: "📄", color: "#888" };
}

const MarketsPage = ({ data }) => {
  const reports = data.allMarkdownRemark.nodes;
  const latest = reports[0];

  return (
    <Layout>
      <div className="page-header">
        <h1>📈 Markets & Intel</h1>
        <p className="page-subtitle">Global crypto intelligence & macro signals — sourced from daily reports</p>
      </div>

      <div className="markets-grid">
        <DataPanel title={`🌐 Latest: Global Crypto Intelligence — ${latest?.fields?.date || ""}`}>
          <div className="report-content markdown-body">
            <div dangerouslySetInnerHTML={{ __html: latest?.html || "<p>No report available.</p>" }} />
          </div>
          {latest?.fields?.slug && (
            <Link to={latest.fields.slug} className="view-all" style={{ marginTop: "12px", display: "inline-block" }}>
              View full report →
            </Link>
          )}
        </DataPanel>

        <DataPanel title="📋 Recent Crypto Reports">
          <div className="report-list">
            {reports.slice(0, 10).map((report) => (
              <Link key={report.id} to={report.fields?.slug || "#"} className="report-list-item">
                <span className="report-date">{report.fields?.date || "—"}</span>
                <span className="report-title">
                  {report.fields?.inferredTitle || "Crypto Report"}
                </span>
              </Link>
            ))}
          </div>
        </DataPanel>

        <DataPanel title="⚡ Recent Catalyst Reports">
          <div className="report-list">
            {data.catalyst.nodes.slice(0, 8).map((report) => (
              <Link key={report.id} to={report.fields?.slug || "#"} className="report-list-item">
                <span className="report-date">{report.fields?.date || "—"}</span>
                <span className="report-title">
                  {report.fields?.inferredTitle || "Catalyst Report"}
                </span>
              </Link>
            ))}
          </div>
        </DataPanel>
      </div>
    </Layout>
  );
};

export default MarketsPage;

export const Head = () => (
  <SEO
    title="Markets & Intel — Bobbie Intelligence"
    description="Daily crypto market intelligence, macro signals, and catalyst tracking from autonomous AI analysts."
    path="/markets/"
  />
);

export const query = graphql`
  query MarketsPage {
    allMarkdownRemark(
      filter: { fields: { category: { eq: "world-crypto" }, reportType: { eq: "daily" } } }
      sort: { fields: { date: DESC } }
      limit: 10
    ) {
      nodes {
        id
        html
        fields {
          slug
          date
          inferredTitle
        }
      }
    }
    catalyst: allMarkdownRemark(
      filter: { fields: { category: { eq: "crypto-catalyst" } } }
      sort: { fields: { date: DESC } }
      limit: 8
    ) {
      nodes {
        id
        fields {
          slug
          date
          inferredTitle
        }
      }
    }
  }
`;
