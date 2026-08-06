import { Suspense } from "react";
import { FeedDashboard } from "@/components/feed-dashboard";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: siteName,
        url: siteUrl.toString(),
        description: siteDescription,
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        name: siteName,
        url: siteUrl.toString(),
        description: siteDescription,
        applicationCategory: "ProductivityApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires a modern web browser with JavaScript enabled.",
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Suspense fallback={<div className="min-h-screen bg-[#f7f8f5]" />}>
        <FeedDashboard />
      </Suspense>
    </>
  );
}
