// Run locally (network that can reach congbobanan.toaan.gov.vn — VN IPs only):
//   npm run cba:fetch
// Scrapes latest published judgments, writes data/congbobanan.json.
// Commit + push + deploy; prod adapter reads the JSON as fallback when
// the live site is unreachable from the server.

import { mkdirSync, writeFileSync } from "node:fs";
import { get as httpsGet } from "node:https";
import { resolve } from "node:path";

type JudgmentItem = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
};

const HOMEPAGE = "https://congbobanan.toaan.gov.vn/";

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

// Site serves an incomplete cert chain (leaf only) — node fetch fails
// UNABLE_TO_VERIFY_LEAF_SIGNATURE. Public judgment data, no auth: fetch with
// lenient TLS verification for this host only.
function fetchPage(url: string): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    const request = httpsGet(url, {
      rejectUnauthorized: false,
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" },
      timeout: 20_000,
    }, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        fetchPage(new URL(response.headers.location, url).toString()).then(resolvePromise, rejectPromise);
        return;
      }
      if (response.statusCode !== 200) {
        rejectPromise(new Error(`${response.statusCode} ${response.statusMessage}`));
        return;
      }
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolvePromise(Buffer.concat(chunks).toString("utf8")));
      response.on("error", rejectPromise);
    });
    request.on("timeout", () => { request.destroy(new Error("timeout")); });
    request.on("error", rejectPromise);
  });
}

async function main() {
  const html = await fetchPage(HOMEPAGE);

  const seen = new Set<string>();
  const items: JudgmentItem[] = [...html.matchAll(/<a[^>]+href="(\/[0-9a-z]+\/chi-tiet-ban-an)"[^>]*>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    const href = match[1];
    const title = stripTags(match[2]);
    if (!title || title.length < 15 || seen.has(href)) return [];
    seen.add(href);
    const dateMatch = title.match(/ngày\s*(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/i);
    const year = dateMatch ? Number(dateMatch[3]) : 0;
    const publishedAt = dateMatch && year >= 2015 && year <= 2100
      ? new Date(Date.UTC(year, Number(dateMatch[2]) - 1, Number(dateMatch[1]))).toISOString()
      : new Date().toISOString();
    return [{ id: `cba-${href}`, title: title.slice(0, 200), url: `${HOMEPAGE.replace(/\/$/, "")}${href}`, publishedAt }];
  }).slice(0, 12);

  if (!items.length) throw new Error("No judgments parsed — page layout may have changed");

  const outPath = resolve(process.cwd(), "data/congbobanan.json");
  mkdirSync(resolve(outPath, ".."), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ fetchedAt: new Date().toISOString(), items }, null, 2));
  console.log(JSON.stringify({ event: "congbobanan_fetch_complete", items: items.length, path: outPath, fetchedAt: new Date().toISOString() }));
}

main().catch((error) => {
  console.error("congbobanan fetch failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
