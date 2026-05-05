import React from "react";


const DataPanel = ({ title, children }) => (
  <div className="data-panel">
    <div className="panel-header">
      <span className="panel-title">{title}</span>
    </div>
    <div className="panel-body">{children}</div>
  </div>
);

export default DataPanel;
