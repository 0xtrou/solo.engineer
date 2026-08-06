import type { Metadata } from "next";
import { Suspense } from "react";
import { InfrastructureTerminal } from "@/components/infrastructure-terminal";
import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "AI Infrastructure Terminal",
  description: "Live, primary-source records for power, policy, hardware, capital, and technology conditions across the United States, Vietnam, and China.",
  alternates: { canonical: "/terminal" },
  openGraph: {
    title: `AI Infrastructure Terminal | ${siteName}`,
    description: "Live, primary-source AI infrastructure records for the United States, Vietnam, and China.",
    url: "/terminal",
  },
};

export default function TerminalPage() {
  return (
    <Suspense fallback={<main className="terminal-shell min-h-screen bg-[#071018]" />}>
      <InfrastructureTerminal />
    </Suspense>
  );
}
