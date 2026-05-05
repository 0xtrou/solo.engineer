const config = {
  siteMetadata: {
    title: "solo.engineer — Terminal",
    description: "Bloomberg Terminal-style intelligence dashboard for solo developers. Real-time crypto signals, trend analysis, legal intelligence, and opportunity radar.",
    author: "solo.engineer",
    siteUrl: "https://solo.engineer",
    keywords: "solo developer, crypto intelligence, trend analysis, AI tools, market signals, opportunity radar",
    social: {
      twitter: "@0xtrou",
    },
  },
  graphqlTypegen: true,
  plugins: [
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "reports",
        path: `${__dirname}/../reports`,
      },
    },
    "gatsby-transformer-remark",
    "gatsby-plugin-sitemap",
    {
      resolve: "gatsby-plugin-robots-txt",
      options: {
        host: "https://solo.engineer",
        sitemap: "https://solo.engineer/sitemap-index.xml",
        policy: [{ userAgent: "*", allow: "/" }],
      },
    },
  ],
};

module.exports = config;
