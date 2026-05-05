import React, { useState } from "react";
import { Link, graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import DataPanel from "../components/DataPanel";

const ReportDetailTemplate = ({ data, pageContext }) => {
  const { category, categoryLabel, categoryIcon, enId, viId } = pageContext;

  // Primary report (the one queried by $id)
  const report = data.markdownRemark;

  // Secondary report (other language)
  const otherReport = data.otherReport;

  // Determine which language variants we have
  const hasEn = enId !== null;
  const hasVi = viId !== null;
  const bothExist = hasEn && hasVi;

  // Figure out which report is en and which is vi
  const primaryLang = report?.fields?.lang || "en";
  const enReport = primaryLang === "en" ? report : otherReport;
  const viReport = primaryLang === "vi" ? report : otherReport;

  // Default to vi if available
  const [activeLang, setActiveLang] = useState(hasVi ? "vi" : "en");

  const currentReport = activeLang === "vi" ? viReport : enReport;
  const title = currentReport?.frontmatter?.title || currentReport?.fields?.inferredTitle || report?.frontmatter?.title || `${categoryLabel} Report`;

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
          <span className="breadcrumb-current">{currentReport?.fields?.date || report?.fields?.date || "Report"}</span>
        </nav>

        <header className="report-header">
          <div className="report-header-row">
            <h1>{title}</h1>
            {bothExist && (
              <div className="lang-switcher">
                <button
                  className={`lang-btn ${activeLang === "vi" ? "lang-btn-active" : ""}`}
                  onClick={() => setActiveLang("vi")}
                >
                  🇻🇳 VI
                </button>
                <button
                  className={`lang-btn ${activeLang === "en" ? "lang-btn-active" : ""}`}
                  onClick={() => setActiveLang("en")}
                >
                  🇬🇧 EN
                </button>
              </div>
            )}
            {!bothExist && hasVi && (
              <span className="lang-badge">🇻🇳 VI</span>
            )}
            {!bothExist && hasEn && !hasVi && (
              <span className="lang-badge">🇬🇧 EN</span>
            )}
          </div>
          <div className="report-meta">
            <span className="report-meta-item">📁 {categoryIcon} {categoryLabel}</span>
            <span className="report-meta-item">📅 {currentReport?.frontmatter?.date || currentReport?.fields?.date || report?.frontmatter?.date || report?.fields?.date || "—"}</span>
            <span className="report-meta-item">👤 Bobbie Intelligence</span>
          </div>
        </header>

        <DataPanel title="Report Content">
          <div
            className="report-content markdown-body"
            dangerouslySetInnerHTML={{ __html: currentReport?.html || report?.html || "" }}
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
    : `Intelligence report from Bobbie Intelligence: ${title}`;

  return (
    <SEO
      title={`${title} — Bobbie Intelligence`}
      description={desc}
      path={report?.fields?.slug || "/"}
      article={{
        publishedTime: report?.frontmatter?.date || report?.fields?.date,
        author: "Bobbie Intelligence",
        category: categoryLabel,
      }}
    />
  );
};

export const query = graphql`
  query ReportDetail($id: String!, $otherId: String) {
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
        lang
      }
      frontmatter {
        title
        date
      }
    }
    otherReport: markdownRemark(id: { eq: $otherId }) {
      id
      html
      excerpt
      fields {
        slug
        category
        categoryLabel
        categoryIcon
        date
        lang
      }
      frontmatter {
        title
        date
      }
    }
  }
`;
