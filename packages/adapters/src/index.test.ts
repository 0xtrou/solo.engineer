import assert from "node:assert/strict";
import test from "node:test";
import { canonicalizeUrl, normalizeForTest } from "./index";

test("canonical URLs discard tracking parameters", () => {
  assert.equal(
    canonicalizeUrl("http://Example.com/path/?utm_source=reader&keep=yes#section"),
    "https://example.com/path?keep=yes",
  );
});

test("normalization generates stable dedupe hashes", () => {
  const record = normalizeForTest({
    id: "hn-1", source: "hacker-news", title: "Title", summary: "Summary", author: "Author",
    url: "https://news.ycombinator.com/item?id=1&utm_source=reader", publishedAt: "2026-08-06T00:00:00.000Z",
  });
  assert.equal(record.sourceItemKey, "hn-1");
  assert.equal(record.canonicalUrl, "https://news.ycombinator.com/item?id=1");
  assert.equal(record.sourceHomepage, "https://news.ycombinator.com");
  assert.equal(record.canonicalUrlHash.length, 64);
  assert.equal(record.contentHash.length, 64);
});
