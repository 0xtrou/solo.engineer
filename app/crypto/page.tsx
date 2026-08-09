import type { Metadata } from "next";
import { Suspense } from "react";
import { CryptoTerminal } from "@/components/crypto-terminal";
import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Crypto Terminal",
  description: "Live, primary-source records for crypto launches, L1/L2 chains, DeFi protocols, and markets across Bitcoin, Ethereum, Solana, and emerging ecosystems.",
  alternates: { canonical: "/crypto" },
  openGraph: {
    title: `Crypto Terminal | ${siteName}`,
    description: "Live crypto infrastructure records — launches, L1/L2 chains, DeFi, and markets.",
    url: "/crypto",
  },
};

export default function CryptoPage() {
  return (
    <Suspense fallback={<main className="crypto-shell min-h-screen bg-[#071018]" />}>
      <CryptoTerminal />
    </Suspense>
  );
}
