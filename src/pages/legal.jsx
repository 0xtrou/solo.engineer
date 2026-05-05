import React from "react";
import { Link, graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import DataPanel from "../components/DataPanel";

const LegalPage = ({ data }) => {
  const reports = data.daily.nodes;
  const onDemand = data.onDemand.nodes;
  const latest = reports[0];

  return (
    <Layout>
      <div className="page-header">
        <h1>⚖️ Vietnam Legal Watch</h1>
        <p className="page-subtitle">Regulatory changes, legal updates & compliance intelligence for Vietnam</p>
      </div>

      <div className="opp-grid">
        {latest && (
          <DataPanel title={`⚖️ Latest — ${latest.fields?.date || ""}`}>
            <div className="report-content markdown-body">
              <div dangerouslySetInnerHTML={{ __html: latest.html || "<p>No report available.</p>" }} />
            </div>
            {latest.fields?.slug && (
              <Link to={latest.fields.slug} className="view-all" style={{ marginTop: "12px", display: "inline-block" }}>
                View full report →
              </Link>
            )}
          </DataPanel>
        )}

        <div className="side-panels">
          {onDemand.length > 0 && (
            <DataPanel title="🔍 Special Analyses">
              <div className="report-list">
                {onDemand.map((report) => (
                  <Link key={report.id} to={report.fields?.slug || "#"} className="report-list-item">
                    <span className="report-date">{report.fields?.date || "—"}</span>
                    <span className="report-title">
                      {report.fields?.inferredTitle || "Legal Analysis"}
                    </span>
                  </Link>
                ))}
              </div>
            </DataPanel>
          )}

          <DataPanel title="📋 Daily Legal Briefings">
            <div className="report-list">
              {reports.slice(0, 12).map((report) => (
                <Link key={report.id} to={report.fields?.slug || "#"} className="report-list-item">
                  <span className="report-date">{report.fields?.date || "—"}</span>
                  <span className="report-title">
                    {report.fields?.inferredTitle || "Legal Briefing"}
                  </span>
                </Link>
              ))}
            </div>
          </DataPanel>
        </div>
      </div>
    </Layout>
  );
};

export default LegalPage;

export const Head = () => (
  <SEO
    title="Vietnam Legal Watch — Bobbie Intelligence"
    description="Daily Vietnamese legal and regulatory monitoring: new laws, decrees, circulars, and compliance changes tracked by autonomous AI agents."
    path="/legal/"
  />
);

export const query = graphql`
  query LegalPage {
    daily: allMarkdownRemark(
      filter: { fields: { category: { eq: "vn-legal-watch" }, reportType: { eq: "daily" } } }
      sort: { fields: { date: DESC } }
      limit: 15
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
    onDemand: allMarkdownRemark(
      filter: { fields: { category: { eq: "vn-legal-watch" }, reportType: { eq: "on-demand" } } }
      sort: { fields: { date: DESC } }
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
