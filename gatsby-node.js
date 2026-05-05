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

// Detect language from filename
// .en.md → "en", .vi.md → "vi", plain .md → "en" (legacy)
function detectLang(filename) {
  if (filename.endsWith(".en.md")) return "en";
  if (filename.endsWith(".vi.md")) return "vi";
  return "en"; // legacy bare .md files
}

// Strip language suffix to get base filename for slug
// "2026-05-05.en.md" → "2026-05-05", "2026-05-05.md" → "2026-05-05"
function baseName(filename) {
  return filename
    .replace(/\.(en|vi)\.md$/, ".md")
    .replace(/\.md$/, "");
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
      lang: String
      baseName: String
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
            lang
            baseName
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

  // Group by slug to create one page per base filename (not per language)
  const slugGroups = {};
  reports.forEach((report) => {
    if (!report.fields?.slug) return;
    const slug = report.fields.slug;
    if (!slugGroups[slug]) slugGroups[slug] = { en: null, vi: null };
    const lang = report.fields.lang || "en";
    slugGroups[slug][lang] = report;
  });

  // Create one page per unique slug, passing both language variants
  Object.entries(slugGroups).forEach(([slug, langs]) => {
    const primary = langs.vi || langs.en;
    if (!primary) return;

    const enId = langs.en ? langs.en.id : null;
    const viId = langs.vi ? langs.vi.id : null;

    // We'll query the primary report via GraphQL, and pass the other language's ID
    // so the template can query it too
    createPage({
      path: slug,
      component: path.resolve("./src/templates/report-detail.jsx"),
      context: {
        id: primary.id,
        slug: slug,
        category: primary.fields?.category,
        categoryLabel: CATEGORY_LABELS[primary.fields?.category] || primary.fields?.category,
        categoryIcon: CATEGORY_ICONS[primary.fields?.category] || "📄",
        enId: enId,
        viId: viId,
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

    // Extract full filename (with extension)
    const fileMatch = fileAbsolutePath.match(/\/([^/]+)$/);
    const fullFilename = fileMatch ? fileMatch[1] : "";

    // Detect language and compute base name
    const lang = detectLang(fullFilename);
    const base = baseName(fullFilename);

    const dateMatch = base.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : "";

    const categoryLabel = CATEGORY_LABELS[rawCategory] || rawCategory;
    const categoryIcon = CATEGORY_ICONS[rawCategory] || "📄";
    const categoryColor = CATEGORY_COLORS[rawCategory] || "#888888";

    // Use frontmatter if available, otherwise infer
    const fmTitle = node.frontmatter?.title || "";
    const fmDate = node.frontmatter?.date || "";
    const fmType = node.frontmatter?.type || "";

    // Extract title from first H1 as fallback
    const rawBody = node.rawMarkdownBody || "";
    const h1Match = rawBody.match(/^#\s+(.+)$/m);
    const inferredTitle = fmTitle || (h1Match ? h1Match[1].trim() : "");

    const reportType = fmType || (isOnDemand(fullFilename, rawCategory) ? "on-demand" : "daily");
    const reportDate = fmDate || date;

    // Slug uses base name (no language suffix)
    const slug = `/reports/${rawCategory}/${base}/`;

    createNodeField({ node, name: "category", value: rawCategory });
    createNodeField({ node, name: "categoryLabel", value: categoryLabel });
    createNodeField({ node, name: "categoryIcon", value: categoryIcon });
    createNodeField({ node, name: "categoryColor", value: categoryColor });
    createNodeField({ node, name: "date", value: reportDate });
    createNodeField({ node, name: "inferredTitle", value: inferredTitle });
    createNodeField({ node, name: "reportType", value: reportType });
    createNodeField({ node, name: "lang", value: lang });
    createNodeField({ node, name: "baseName", value: base });
    createNodeField({ node, name: "slug", value: slug });
  }
};
