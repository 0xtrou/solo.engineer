import React from "react";
;
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import DataPanel from "../components/DataPanel";

const OpportunitiesPage = () => {
  return (
    <Layout>
      <div className="page-header">
        <h1>🎯 Opportunity Radar</h1>
        <p className="page-subtitle">Scored plays for solo developers</p>
      </div>

      <div className="opp-grid">
        <DataPanel title="🔥 Hot Signals">
          <p className="panel-note">
            Opportunity signals are extracted from Product Engineer reports.
            Check the <strong>Product Engineer</strong> category for the latest scored opportunities.
          </p>
          <div className="opp-scores">
            <div className="score-card hot">
              <span className="score-icon">🔥</span>
              <span className="score-label">AI SaaS Clones</span>
              <span className="score-desc">High feasibility, proven demand</span>
            </div>
            <div className="score-card warm">
              <span className="score-icon">🟡</span>
              <span className="score-label">Data-as-a-Service</span>
              <span className="score-desc">Growing market, technical moat</span>
            </div>
            <div className="score-card watch">
              <span className="score-icon">👀</span>
              <span className="score-label">VN Market Entry</span>
              <span className="score-desc">Regulatory clarity improving</span>
            </div>
          </div>
        </DataPanel>

        <DataPanel title="📊 Scoring Methodology">
          <ul className="methodology-list">
            <li><strong>Market Size</strong> — TAM/SAM for solo-dev reachable market</li>
            <li><strong>Technical Feasibility</strong> — Can one person build it in &lt;30 days?</li>
            <li><strong>Competition</strong> — Less is better for solo devs</li>
            <li><strong>Revenue Potential</strong> — MRR achievable within 6 months</li>
            <li><strong>Trend Signal</strong> — Agent consensus on momentum</li>
          </ul>
        </DataPanel>

        <DataPanel title="💡 How It Works">
          <p>
            Opportunities are surfaced daily by the Product Engineer agent, which
            cross-references trend data, market signals, and legal intelligence to
            identify and score viable solo developer plays. Reports are generated
            automatically and published to this terminal.
          </p>
        </DataPanel>
      </div>
    </Layout>
  );
};

export default OpportunitiesPage;

export const Head = () => (
  <SEO
    title="Opportunities — solo.engineer Terminal"
    description="Scored solo developer opportunities: AI SaaS, data services, and market entry plays ranked by feasibility and revenue potential."
    path="/opportunities/"
  />
);
