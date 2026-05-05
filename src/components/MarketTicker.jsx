import React from "react";
import { Link, useStaticQuery, graphql } from "gatsby";

const MarketTicker = ({ reports: injectedReports }) => {
  const data = useStaticQuery(graphql`
    query TickerQuery {
      allMarkdownRemark(
        sort: { fields: { date: DESC } }
        limit: 10
      ) {
        nodes {
          id
          fields {
            slug
            date
            inferredTitle
            categoryIcon
          }
        }
      }
    }
  `);

  const reports = injectedReports || data.allMarkdownRemark.nodes;

  return (
    <div className="market-ticker" aria-label="Latest reports ticker">
      <div className="ticker-content">
        {reports.map((report, i) => {
          const title = report.fields?.inferredTitle || "Report";
          const icon = report.fields?.categoryIcon || "📄";
          const slug = report.fields?.slug || "#";
          return (
            <React.Fragment key={report.id}>
              {i > 0 && <span className="ticker-sep">|</span>}
              <Link to={slug} className="ticker-link">
                {icon} {title.length > 60 ? title.substring(0, 60) + "…" : title}
              </Link>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default MarketTicker;
