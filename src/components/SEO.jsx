import React from "react";


const SEO = ({ title, description, path, article }) => {
  const siteUrl = "https://solo.engineer";
  const fullUrl = `${siteUrl}${path}`;
  const ogImage = `${siteUrl}/og-image.png`;

  const jsonLd = article
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url: fullUrl,
        image: ogImage,
        datePublished: article.publishedTime,
        dateModified: article.publishedTime,
        author: {
          "@type": "Organization",
          name: article.author || "Bobbie Intelligence",
          url: siteUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "Bobbie Intelligence",
          logo: { "@type": "ImageObject", url: `${siteUrl}/logo.svg` },
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Bobbie Intelligence",
        description,
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/reports/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      ...(path !== "/"
        ? [{ "@type": "ListItem", position: 2, name: title.replace(" — Bobbie Intelligence", "").replace(" — ", " "), item: fullUrl }]
        : []),
    ],
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="AI intelligence, crypto analysis, trend scouting, solo developer, market signals, opportunity radar, autonomous agents, Bobbie Intelligence" />
      <meta name="author" content="Bobbie Intelligence" />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#FF7300" />
      <link rel="canonical" href={fullUrl} />

      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Bobbie Intelligence — Autonomous Intelligence Terminal" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={article ? "article" : "website"} />
      <meta property="og:site_name" content="Bobbie Intelligence" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="Bobbie Intelligence — Autonomous Intelligence Terminal" />

      {/* JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
    </>
  );
};

export default SEO;
