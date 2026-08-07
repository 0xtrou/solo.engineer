import { NextRequest, NextResponse } from "next/server";
import { getFeed } from "@/lib/feed";

export const revalidate = 600;

export async function GET(request: NextRequest) {
  const data = await getFeed(request.nextUrl.searchParams.get("sources"));
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=600, stale-while-revalidate=1800",
    },
  });
}
