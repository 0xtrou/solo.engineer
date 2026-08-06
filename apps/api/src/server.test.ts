import assert from "node:assert/strict";
import test from "node:test";
import { decodeCursor, encodeCursor } from "./server";

const secret = "test-secret";

test("cursor round trips immutable latest-first tuple", () => {
  const source = { publishedAt: "2026-08-06T00:00:00.000Z", id: "00000000-0000-0000-0000-000000000001", asOf: "2026-08-06T01:00:00.000Z", filters: "{}" };
  const encoded = encodeCursor(source, secret);
  assert.deepEqual(decodeCursor(encoded, secret), { v: 1, ...source, sig: decodeCursor(encoded, secret).sig });
});

test("cursor rejects tampering", () => {
  const encoded = encodeCursor({ publishedAt: "2026-08-06T00:00:00.000Z", id: "id", asOf: "2026-08-06T01:00:00.000Z", filters: "{}" }, secret);
  const tampered = `${encoded.slice(0, -1)}${encoded.endsWith("a") ? "b" : "a"}`;
  assert.throws(() => decodeCursor(tampered, secret), /Invalid cursor/);
});
