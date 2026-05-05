import React from "react";
import { Link, graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import DataPanel from "../components/DataPanel";

const OpportunitiesPage = ({ data }) => {
  const daily = data.daily.nodes;
  const onDemand = data.onDemand.nodes;
  const latestDaily = daily[0];

  return (
    <Layout>
      <div className="page-header">
        <h1>🎯 Plays & Opportunities</h1>
        <p className="page-subtitle">Scored solo developer opportunities — sourced from Product Engineer analysis</p>
      </div>

      <div className="opp-grid">
        {latestDaily && (
          <DataPanel title={`🛠️ Latest Analysis — ${latestDaily.fields?.date || ""}`}>
            <div className="report-content markdown-body">
              <div dangerouslySetInnerHTML={{ __html: latestDaily.html || "<p>No report available.</p>" }} />
            </div>
            {latestDaily.fields?.slug && (
              <Link to={latestDaily.fields.slug} className="view-all" style={{ marginTop: "12px", display: "inline-block" }}>
                View full report →
              </Link>
            )}
          </DataPanel>
        )}

        {onDemand.length > 0 && (
          <DataPanel title="🎯 On-Demand Deep Dives">
            <div className="report-list">
              {onDemand.map((report) => (
                <Link key={report.id} to={report.fields?.slug || "#"} className="report-list-item">
                  <span className="report-date">{report.fields?.date || "—"}</span>
                  <span className="report-title">
                    {report.fields?.inferredTitle || "Analysis"}
                  </span>
                </Link>
              ))}
            </div>
          </DataPanel>
        )}

        <DataPanel title="📋 Daily Feasibility Reports">
          <div className="report-list">
            {daily.slice(0, 15).map((report) => (
              <Link key={report.id} to={report.fields?.slug || "#"} className="report-list-item">
                <span className="report-date">{report.fields?.date || "—"}</span>
                <span className="report-title">
                  {report.fields?.inferredTitle || "Product Engineer Report"}
                </span>
              </Link>
            ))}
          </div>
        </DataPanel>
      </div>
    </Layout>
  );
};

export default OpportunitiesPage;

export const Head = () => (
  <SEO
    title="Plays & Opportunities — Bobbie Intelligence"
    description="Scored solo developer opportunities: AI SaaS feasibility, market entry plays, and monetization strategies from autonomous Product Engineer analysis."
    path="/opportunities/"
  />
);

export const query = graphql`
  query OpportunitiesPage {
    daily: allMarkdownRemark(
      filter: { fields: { category: { eq: "product-engineer" }, reportType: { eq: "daily" } } }
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
      filter: { fields: { category: { eq: "product-engineer" }, reportType: { eq: "on-demand" } } }
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
