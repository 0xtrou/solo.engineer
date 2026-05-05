import React from "react";
import { Link, graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import DataPanel from "../components/DataPanel";

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

        <div className="side-panels">
          <DataPanel title="📋 Recent Crypto Reports">
            <div className="report-list">
              {reports.slice(0, 8).map((report) => (
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
