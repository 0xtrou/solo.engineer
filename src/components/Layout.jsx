import React from "react";
import { Link } from "gatsby";
import SearchBar from "./SearchBar";


const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/reports/", label: "Reports", icon: "📋" },
  { path: "/markets/", label: "Markets", icon: "📈" },
  { path: "/opportunities/", label: "Plays", icon: "🎯" },
  { path: "/about/", label: "About", icon: "ℹ️" },
];

const Layout = ({ children }) => {
  return (
    <div className="terminal-layout">
      <header className="terminal-header">
        <div className="header-left">
          <Link to="/" className="logo-link">
            <img src="/logo.svg" alt="Bobbie Intelligence logo" className="logo" width={32} height={32} />
            <span className="logo-text">Bobbie Intelligence</span>
          </Link>
        </div>
        <nav className="header-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.path} to={item.path} className="nav-link" activeClassName="nav-link-active">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-right">
          <SearchBar />
          <span className="terminal-time">{new Date().toISOString().split("T")[0]}</span>
        </div>
      </header>

      <main className="terminal-main">{children}</main>

      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => (
          <Link key={item.path} to={item.path} className="mobile-nav-link" activeClassName="mobile-nav-active">
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <footer className="terminal-footer">
        <span>© {new Date().getFullYear()} Bobbie Intelligence</span>
        <span>Built with ⚡ by autonomous agents</span>
      </footer>
    </div>
  );
};

export default Layout;
