import React from "react";


const SEO = ({ title, description, path, article }) => {
  const siteUrl = "https://solo.engineer";
  const fullUrl = `${siteUrl}${path}`;
  const ogImage = `${siteUrl}/logo.svg`;

  const jsonLd = article
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url: fullUrl,
        image: ogImage,
        datePublished: article.publishedTime,
        author: {
          "@type": "Organization",
          name: article.author || "Bobbie Intelligence",
          url: siteUrl,
        },
        publisher: {
          "@type": "Organization",
          name: "Bobbie Intelligence",
          logo: { "@type": "ImageObject", url: ogImage },
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Bobbie Intelligence",
        description,
        url: siteUrl,
      };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      ...(path !== "/"
        ? [{ "@type": "ListItem", position: 2, name: title, item: fullUrl }]
        : []),
    ],
  };

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="solo developer, crypto intelligence, trend analysis, AI tools, market signals" />
      <meta name="author" content="Bobbie Intelligence" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={article ? "article" : "website"} />
      <meta property="og:site_name" content="Bobbie Intelligence" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
    </>
  );
};

export default SEO;
