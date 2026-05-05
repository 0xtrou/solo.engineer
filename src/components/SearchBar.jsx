import React, { useState, useEffect, useRef } from "react";
import { Link, graphql, useStaticQuery } from "gatsby";
import lunr from "lunr";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [idx, setIdx] = useState(null);
  const [docs, setDocs] = useState({});
  const wrapperRef = useRef(null);

  const data = useStaticQuery(graphql`
    query SearchIndex {
      allMarkdownRemark {
        nodes {
          id
          rawMarkdownBody
          fields {
            slug
            category
            categoryLabel
            categoryIcon
            date
          }
          frontmatter {
            title
          }
          excerpt
        }
      }
    }
  `);

  useEffect(() => {
    const docsMap = {};
    const documents = [];
    data.allMarkdownRemark.nodes.forEach((node) => {
      if (!node.fields?.slug) return;
      docsMap[node.id] = {
        slug: node.fields.slug,
        title: node.frontmatter?.title || `${node.fields.categoryLabel} — ${node.fields.date}`,
        category: node.fields.categoryLabel || node.fields.category,
        icon: node.fields.categoryIcon || "📄",
        date: node.fields.date || "",
        excerpt: (node.excerpt || "").substring(0, 120),
      };
      documents.push({
        id: node.id,
        title: node.frontmatter?.title || "",
        body: node.rawMarkdownBody || "",
        category: node.fields.categoryLabel || "",
        date: node.fields.date || "",
      });
    });

    const index = lunr(function () {
      this.ref("id");
      this.field("title", { boost: 10 });
      this.field("body");
      this.field("category", { boost: 5 });
      documents.forEach((doc) => this.add(doc));
    });

    setIdx(index);
    setDocs(docsMap);
  }, [data]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (val) => {
    setQuery(val);
    if (!idx || !val.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    try {
      const search = idx.search(val.trim());
      const hits = search.slice(0, 10).map((r) => docs[r.ref]).filter(Boolean);
      setResults(hits);
      setIsOpen(hits.length > 0);
    } catch {
      setResults([]);
      setIsOpen(false);
    }
  };

  return (
    <div className="search-bar" ref={wrapperRef}>
      <input
        type="search"
        placeholder="🔍 Search reports..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        aria-label="Search reports"
      />
      {isOpen && (
        <div className="search-results">
          {results.map((r, i) => (
            <Link key={i} to={r.slug} className="search-result-item" onClick={() => { setIsOpen(false); setQuery(""); }}>
              <span className="search-result-icon">{r.icon}</span>
              <div className="search-result-text">
                <span className="search-result-title">{r.title}</span>
                <span className="search-result-meta">{r.category} · {r.date}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
