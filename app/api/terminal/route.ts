import { NextResponse } from "next/server";
import { getTerminalFeed } from "@/lib/terminal-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getTerminalFeed();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=600, stale-while-revalidate=1800",
    },
  });
}
