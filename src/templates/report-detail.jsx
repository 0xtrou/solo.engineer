import React from "react";
import { Link, graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import DataPanel from "../components/DataPanel";

const ReportDetailTemplate = ({ data, pageContext }) => {
  const report = data.markdownRemark;
  const { category, categoryLabel, categoryIcon } = pageContext;

  return (
    <Layout>
      <article className="report-detail">
        <nav className="report-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Dashboard</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to="/reports/">Reports</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to={`/reports/${category}/`}>{categoryIcon} {categoryLabel}</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{report?.fields?.date || "Report"}</span>
        </nav>

        <header className="report-header">
          <h1>{report?.frontmatter?.title || `${categoryLabel} Report`}</h1>
          <div className="report-meta">
            <span className="report-meta-item">📁 {categoryIcon} {categoryLabel}</span>
            <span className="report-meta-item">📅 {report?.frontmatter?.date || report?.fields?.date || "—"}</span>
            <span className="report-meta-item">👤 solo.engineer</span>
          </div>
        </header>

        <DataPanel title="Report Content">
          <div
            className="report-content markdown-body"
            dangerouslySetInnerHTML={{ __html: report?.html || "" }}
          />
        </DataPanel>
      </article>
    </Layout>
  );
};

export default ReportDetailTemplate;

export const Head = ({ data, pageContext }) => {
  const report = data.markdownRemark;
  const { categoryLabel } = pageContext;
  const title = report?.frontmatter?.title || `${categoryLabel} Report`;
  const desc = report?.excerpt
    ? report.excerpt.substring(0, 160)
    : `Intelligence report from solo.engineer: ${title}`;

  return (
    <SEO
      title={`${title} — solo.engineer`}
      description={desc}
      path={report?.fields?.slug || "/"}
      article={{
        publishedTime: report?.frontmatter?.date || report?.fields?.date,
        author: "solo.engineer",
        category: categoryLabel,
      }}
    />
  );
};

export const query = graphql`
  query ReportDetail($id: String!) {
    markdownRemark(id: { eq: $id }) {
      id
      html
      excerpt
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
    }
  }
`;
