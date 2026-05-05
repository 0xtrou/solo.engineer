import React from "react";
import { Link, graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import DataPanel from "../components/DataPanel";

const CATEGORY_LABELS = {
  "world-crypto": "Global Crypto Intel",
  "trend-scout": "Trend Scout",
  "vn-legal-watch": "VN Legal Eagle",
  "product-engineer": "Product Engineer",
  "crypto-catalyst": "Crypto Catalyst",
  "agent-ops": "Agent Ops",
  "dataset-marketplace": "Data Market",
  "concept-monetizer": "Monetizer",
  "market-agent": "Market Agent",
};

const CategoryTemplate = ({ data, pageContext }) => {
  const category = (pageContext).category || "";
  const label = CATEGORY_LABELS[category] || category;
  const nodes = data.allMarkdownRemark.nodes;

  return (
    <Layout>
      <nav className="report-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/reports/">Reports</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{label}</span>
      </nav>

      <div className="page-header">
        <h1>{label}</h1>
        <p className="page-subtitle">{nodes.length} reports</p>
      </div>

      <DataPanel title={`All ${label} Reports`}>
        <div className="report-list">
          {nodes.map((node) => (
            <Link key={node.id} to={node.fields?.slug || "/"} className="report-list-item">
              <span className="report-date">{node.fields?.date || "—"}</span>
              <span className="report-title">
                {node.frontmatter?.title || `${label} — ${node.fields?.date || "Report"}`}
              </span>
            </Link>
          ))}
        </div>
      </DataPanel>
    </Layout>
  );
};

export default CategoryTemplate;

export const Head = ({ pageContext }) => {
  const category = (pageContext).category || "";
  const label = CATEGORY_LABELS[category] || category;
  return (
    <SEO
      title={`${label} Reports — solo.engineer`}
      description={`Browse all ${label} intelligence reports from solo.engineer.`}
      path={`/reports/${category}/`}
    />
  );
};

export const query = graphql`
  query CategoryPage($category: String!) {
    allMarkdownRemark(
      filter: { fields: { category: { eq: $category } } }
      sort: { frontmatter: { date: DESC } }
    ) {
      nodes {
        id
        fields {
          slug
          category
          date
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
