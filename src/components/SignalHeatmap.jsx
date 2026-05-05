import React from "react";


const SignalHeatmap = ({ categories, getCategoryMeta }) => (
  <div className="signal-heatmap">
    {categories.map(([cat, items]) => {
      const meta = getCategoryMeta(cat);
      const latest = items[0]?.fields?.date || "—";
      const age = items[0]?.fields?.date
        ? Math.floor((Date.now() - new Date(items[0].fields.date).getTime()) / 86400000)
        : 999;
      const signal = age <= 1 ? "🔥" : age <= 3 ? "🟢" : age <= 7 ? "🟡" : "🔴";
      return (
        <a key={cat} href={`/reports/${cat}/`} className="signal-item" title={`${meta.label}: last report ${latest}`}>
          <span className="signal-icon">{meta.icon}</span>
          <span className="signal-label">{meta.label}</span>
          <span className="signal-strength">{signal}</span>
          <span className="signal-count">{items.length}</span>
        </a>
      );
    })}
  </div>
);

export default SignalHeatmap;
