import { NextResponse } from "next/server";
import { getTerminalFeed } from "@/lib/terminal-feed";

export const revalidate = 300;

export async function GET() {
  const data = await getTerminalFeed();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=900",
    },
  });
}
