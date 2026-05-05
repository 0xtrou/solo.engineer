import React from "react";
import { Link, graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";

const ReportsPage = ({ data }) => {
  const categories = {};
  const CATEGORY_ORDER = [
    "world-crypto", "trend-scout", "vn-legal-watch", "product-engineer",
    "crypto-catalyst", "dataset-marketplace", "concept-monetizer",
  ];

  data.allMarkdownRemark.nodes.forEach((node) => {
    const cat = node.fields?.category || "uncategorized";
    if (!categories[cat]) {
      categories[cat] = {
        nodes: [],
        label: node.fields?.categoryLabel || cat,
        icon: node.fields?.categoryIcon || "📄",
        color: node.fields?.categoryColor || "#888888",
      };
    }
    categories[cat].nodes.push(node);
  });

  const sorted = Object.entries(categories).sort(([a], [b]) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <Layout>
      <div className="page-header">
        <h1>📋 All Reports</h1>
        <p className="page-subtitle">{data.allMarkdownRemark.nodes.length} intelligence reports across {sorted.length} categories</p>
      </div>

      <div className="report-categories">
        {sorted.map(([cat, { nodes, label, icon }]) => (
          <section key={cat} className="category-section">
            <div className="category-header">
              <h2>
                <span className="cat-icon">{icon}</span> {label}
              </h2>
              <span className="badge">{nodes.length}</span>
              <Link to={`/reports/${cat}/`} className="view-all">View all →</Link>
            </div>
            <div className="report-list">
              {nodes.slice(0, 5).map((node) => (
                <Link key={node.id} to={node.fields?.slug || "/"} className="report-list-item">
                  <span className="report-date">{node.fields?.date || "—"}</span>
                  <span className="report-title">
                    {node.frontmatter?.title || `${label} — ${node.fields?.date || "Report"}`}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
};

export default ReportsPage;

export const Head = () => (
  <SEO
    title="Reports — Bobbie Intelligence"
    description="Browse all intelligence reports: crypto signals, trend analysis, legal updates, and opportunity radar."
    path="/reports/"
  />
);

export const query = graphql`
  query ReportsPage {
    allMarkdownRemark(sort: { fields: { date: DESC } }) {
      nodes {
        id
        fields {
          slug
          category
          categoryLabel
          categoryIcon
          categoryColor
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
