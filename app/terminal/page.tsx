import type { Metadata } from "next";
import { InfrastructureTerminal } from "@/components/infrastructure-terminal";
import { getTerminalFeed } from "@/lib/terminal-feed";
import { siteName } from "@/lib/site";

export const dynamic = "force-dynamic";

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

export default async function TerminalPage() {
  const initialFeed = await getTerminalFeed();
  return <InfrastructureTerminal initialFeed={initialFeed} />;
}
