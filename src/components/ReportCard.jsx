import React from "react";
import { Link } from "gatsby";


const ReportCard = ({ slug, category, date, title, excerpt, icon, color }) => (
  <Link to={slug} className="report-card" style={{ borderLeftColor: color }}>
    <div className="report-card-header">
      <span className="report-card-icon">{icon}</span>
      <span className="report-card-date">{date}</span>
    </div>
    <h3 className="report-card-title">{title}</h3>
    <p className="report-card-excerpt">{excerpt.substring(0, 120)}…</p>
    <span className="report-card-category">{category}</span>
  </Link>
);

export default ReportCard;
