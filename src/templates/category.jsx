import React from "react";
import { Link, graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import DataPanel from "../components/DataPanel";

const CategoryTemplate = ({ data, pageContext }) => {
  const { categoryLabel, categoryIcon } = pageContext;
  const nodes = data.allMarkdownRemark.nodes;

  return (
    <Layout>
      <nav className="report-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to="/reports/">Reports</Link>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-current">{categoryIcon} {categoryLabel}</span>
      </nav>

      <div className="page-header">
        <h1>{categoryIcon} {categoryLabel}</h1>
        <p className="page-subtitle">{nodes.length} reports</p>
      </div>

      <DataPanel title={`All ${categoryLabel} Reports`}>
        <div className="report-list">
          {nodes.map((node) => (
            <Link key={node.id} to={node.fields?.slug || "/"} className="report-list-item">
              <span className="report-date">{node.fields?.date || "—"}</span>
              <span className="report-title">
                {node.frontmatter?.title || `${categoryLabel} — ${node.fields?.date || "Report"}`}
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
  const { categoryLabel } = pageContext;
  return (
    <SEO
      title={`${categoryLabel} Reports — Bobbie Intelligence`}
      description={`Browse all ${categoryLabel} intelligence reports from Bobbie Intelligence.`}
      path={`/reports/${pageContext.category}/`}
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
          categoryLabel
          categoryIcon
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
