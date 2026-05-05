const path = require("path");

const CATEGORY_LABELS = {
  "world-crypto": "Global Crypto Intelligence",
  "trend-scout": "Trend Scout",
  "vn-legal-watch": "Vietnam Legal Watch",
  "product-engineer": "Product Engineer",
  "crypto-catalyst": "Crypto Catalyst Sentinel",
  "dataset-marketplace": "Dataset Marketplace",
  "concept-monetizer": "Concept Monetizer",
};

const CATEGORY_ICONS = {
  "world-crypto": "🌐",
  "trend-scout": "🔍",
  "vn-legal-watch": "⚖️",
  "product-engineer": "🛠️",
  "crypto-catalyst": "⚡",
  "dataset-marketplace": "📊",
  "concept-monetizer": "💰",
};

const CATEGORY_COLORS = {
  "world-crypto": "#8B5CF6",
  "trend-scout": "#10B981",
  "vn-legal-watch": "#F59E0B",
  "product-engineer": "#0066CC",
  "crypto-catalyst": "#EF4444",
  "dataset-marketplace": "#6366F1",
  "concept-monetizer": "#22C55E",
};

// On-demand categories — spawned manually, not on cron
const ON_DEMAND_CATEGORIES = ["concept-monetizer"];

// On-demand filenames — non-standard patterns (not YYYY-MM-DD or YYYY-MM-DD-HHMM)
function isOnDemand(filename, category) {
  if (ON_DEMAND_CATEGORIES.includes(category)) return true;
  // Daily patterns: YYYY-MM-DD.md, YYYY-MM-DD-HHMM.md, YYYY-MM-DD-XXXX.md
  const isDailyName = /^\d{4}-\d{2}-\d{2}(-.*)?\.md$/.test(filename);
  return !isDailyName;
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  createTypes(`
    type MarkdownRemark implements Node {
      fields: MarkdownRemarkFields
      frontmatter: MarkdownRemarkFrontmatter
    }
    type MarkdownRemarkFields {
      slug: String
      category: String
      categoryLabel: String
      categoryIcon: String
      categoryColor: String
      date: String
      inferredTitle: String
      reportType: String
    }
    type MarkdownRemarkFrontmatter {
      title: String
      date: String @dateformat
    }
  `);
};

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

  const result = await graphql(`
    query AllReports {
      allMarkdownRemark(sort: { fields: { date: DESC } }) {
        nodes {
          id
          fields {
            slug
            category
            date
          }
          frontmatter {
            title
            date
          }
          excerpt
        }
      }
    }
  `);

  if (!result.data) return;

  const reports = result.data.allMarkdownRemark.nodes;

  const categories = new Set();
  reports.forEach((r) => {
    if (r.fields?.category) categories.add(r.fields.category);
  });

  reports.forEach((report) => {
    if (!report.fields?.slug) return;
    createPage({
      path: report.fields.slug,
      component: path.resolve("./src/templates/report-detail.jsx"),
      context: {
        id: report.id,
        slug: report.fields.slug,
        category: report.fields.category,
        categoryLabel: CATEGORY_LABELS[report.fields.category] || report.fields.category,
        categoryIcon: CATEGORY_ICONS[report.fields.category] || "📄",
      },
    });
  });

  categories.forEach((category) => {
    createPage({
      path: `/reports/${category}/`,
      component: path.resolve("./src/templates/category.jsx"),
      context: {
        category,
        categoryLabel: CATEGORY_LABELS[category] || category,
        categoryIcon: CATEGORY_ICONS[category] || "📄",
      },
    });
  });
};

exports.onCreateNode = ({ node, actions }) => {
  const { createNodeField } = actions;

  if (node.internal.type === "MarkdownRemark") {
    const fileAbsolutePath = node.fileAbsolutePath || "";
    const reportsMatch = fileAbsolutePath.match(/\/reports\/([^/]+)\//);
    const rawCategory = reportsMatch ? reportsMatch[1] : "uncategorized";

    const fileMatch = fileAbsolutePath.match(/\/([^/]+)\.md$/);
    const filename = fileMatch ? fileMatch[1] : "";
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : "";

    const categoryLabel = CATEGORY_LABELS[rawCategory] || rawCategory;
    const categoryIcon = CATEGORY_ICONS[rawCategory] || "📄";
    const categoryColor = CATEGORY_COLORS[rawCategory] || "#888888";

    // Extract title from first H1 in markdown body
    const rawBody = node.rawMarkdownBody || "";
    const h1Match = rawBody.match(/^#\s+(.+)$/m);
    const inferredTitle = h1Match ? h1Match[1].trim() : "";

    const reportType = isOnDemand(filename + ".md", rawCategory) ? "on-demand" : "daily";

    createNodeField({ node, name: "category", value: rawCategory });
    createNodeField({ node, name: "categoryLabel", value: categoryLabel });
    createNodeField({ node, name: "categoryIcon", value: categoryIcon });
    createNodeField({ node, name: "categoryColor", value: categoryColor });
    createNodeField({ node, name: "date", value: date });
    createNodeField({ node, name: "inferredTitle", value: inferredTitle });
    createNodeField({ node, name: "reportType", value: reportType });
    createNodeField({
      node,
      name: "slug",
      value: `/reports/${rawCategory}/${filename}/`,
    });
  }
};
