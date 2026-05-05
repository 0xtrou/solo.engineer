const path = require("path");

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
      date: String
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
      allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
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
      },
    });
  });

  categories.forEach((category) => {
    createPage({
      path: `/reports/${category}/`,
      component: path.resolve("./src/templates/category.jsx"),
      context: {
        category,
      },
    });
  });
};

exports.onCreateNode = ({ node, actions }) => {
  const { createNodeField } = actions;

  if (node.internal.type === "MarkdownRemark") {
    const fileAbsolutePath = node.fileAbsolutePath || "";
    const reportsMatch = fileAbsolutePath.match(/\/reports\/([^/]+)\//);
    const category = reportsMatch ? reportsMatch[1] : "uncategorized";

    const fileMatch = fileAbsolutePath.match(/\/([^/]+)\.md$/);
    const filename = fileMatch ? fileMatch[1] : "";
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : "";

    createNodeField({ node, name: "category", value: category });
    createNodeField({ node, name: "date", value: date });
    createNodeField({
      node,
      name: "slug",
      value: `/reports/${category}/${filename}/`,
    });
  }
};
