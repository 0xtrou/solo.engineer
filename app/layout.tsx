import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

const sans = DM_Sans({ variable: "--signal-sans", subsets: ["latin"] });
const mono = DM_Mono({ variable: "--signal-mono", subsets: ["latin"], weight: ["400", "500"] });
const display = Fraunces({ variable: "--signal-display", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: `${siteName} — AI Infrastructure Intelligence`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: `${siteName} Infrastructure Intelligence`,
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  generator: "Next.js",
  keywords: [
    "AI infrastructure",
    "data centers",
    "power markets",
    "GPU costs",
    "data center policy",
    "Vietnam infrastructure",
    "US infrastructure",
    "China infrastructure",
  ],
  referrer: "strict-origin-when-cross-origin",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteName,
    startupImage: [
      { url: "/splash/apple-splash-640x1136.png", media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/apple-splash-750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/apple-splash-828x1792.png", media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/apple-splash-1125x2436.png", media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1284x2778.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
      { url: "/splash/apple-splash-1488x2266.png", media: "(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/apple-splash-1668x2388.png", media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" },
      { url: "/splash/apple-splash-2048x2732.png", media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" },
    ],
  },
  formatDetection: { email: false, address: false, telephone: false },
  category: "technology",
  classification: "AI infrastructure, power, hardware, land, and capital intelligence",
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: `${siteName} — AI Infrastructure Intelligence`,
    description: siteDescription,
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Signal — AI Infrastructure Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — AI Infrastructure Intelligence`,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#071014",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${display.variable}`}><QueryProvider>{children}</QueryProvider></body>
    </html>
  );
}
