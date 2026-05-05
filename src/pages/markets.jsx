import React from "react";
;
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import DataPanel from "../components/DataPanel";

const MarketsPage = () => {
  return (
    <Layout>
      <div className="page-header">
        <h1>📈 Markets</h1>
        <p className="page-subtitle">AI token prices, crypto signals, compute pricing</p>
      </div>

      <div className="markets-grid">
        <DataPanel title="🌐 Crypto Market Intel">
          <p className="panel-note">
            Daily crypto market intelligence from the Global Crypto Analyst.
            Check the <strong>World Crypto</strong> report category for detailed analysis.
          </p>
          <div className="market-items">
            <div className="market-item">
              <span className="market-label">BTC Dominance</span>
              <span className="market-value">—</span>
            </div>
            <div className="market-item">
              <span className="market-label">AI Token Index</span>
              <span className="market-value">—</span>
            </div>
            <div className="market-item">
              <span className="market-label">DeFi TVL</span>
              <span className="market-value">—</span>
            </div>
            <div className="market-item">
              <span className="market-label">Fear & Greed</span>
              <span className="market-value">—</span>
            </div>
          </div>
          <p className="data-note">Live data coming soon — currently sourced from daily reports</p>
        </DataPanel>

        <DataPanel title="⚡ Catalyst Tracker">
          <p className="panel-note">
            Macro event tracking for crypto markets. Updated every 8 hours.
            See <strong>Crypto Catalyst</strong> reports for full analysis.
          </p>
        </DataPanel>

        <DataPanel title="🖥️ Compute Pricing">
          <div className="market-items">
            <div className="market-item">
              <span className="market-label">GPU (A100/hr)</span>
              <span className="market-value">~$1.50</span>
            </div>
            <div className="market-item">
              <span className="market-label">GPU (H100/hr)</span>
              <span className="market-value">~$3.00</span>
            </div>
            <div className="market-item">
              <span className="market-label">VPS (4C/8G/mo)</span>
              <span className="market-value">~$24</span>
            </div>
          </div>
          <p className="data-note">Approximate pricing — varies by provider</p>
        </DataPanel>
      </div>
    </Layout>
  );
};

export default MarketsPage;

export const Head = () => (
  <SEO
    title="Markets — solo.engineer Terminal"
    description="Crypto market intelligence, AI token pricing, and compute cost tracking for solo developers."
    path="/markets/"
  />
);
