import { NextResponse } from "next/server";
import { getCryptoFeed } from "@/lib/crypto-feed";

export const revalidate = 600;

export async function GET() {
  const data = await getCryptoFeed();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "s-maxage=600, stale-while-revalidate=1800",
    },
  });
}
