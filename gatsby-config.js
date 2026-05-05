const config = {
  siteMetadata: {
    title: "Bobbie Intelligence — Terminal",
    description: "Bloomberg Terminal-style intelligence dashboard powered by autonomous AI agents. Crypto signals, trend analysis, legal intelligence, and opportunity radar.",
    author: "Bobbie Intelligence",
    siteUrl: "https://solo.engineer",
    keywords: "AI intelligence, crypto analysis, trend scouting, solo developer, market signals, opportunity radar, autonomous agents",
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
        ignore: ["**/agent-ops/**"],
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
