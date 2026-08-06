import { createHmac } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import { and, asc, desc, eq, gte, ilike, inArray, lte, lt, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "../../../packages/db/src/client";
import { feedRecords, sourceHealth, sources } from "../../../packages/db/src/schema";

const cursorVersion = 1;
const defaultLimit = 30;
const maxLimit = 100;

const feedQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(maxLimit).default(defaultLimit),
  q: z.string().trim().max(200).optional(),
  source: z.string().trim().max(4_000).optional(),
  region: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  asOf: z.string().datetime().optional(),
});

const terminalQuerySchema = z.object({
  region: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  asOf: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(250),
});

type FeedQuery = z.infer<typeof feedQuerySchema>;
type CursorPayload = {
  v: number;
  publishedAt: string;
  id: string;
  asOf: string;
  filters: string;
  sig: string;
};

type CursorBody = Omit<CursorPayload, "sig">;

function sourceIds(source: string | undefined): string[] {
  return source?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
}

function filterFingerprint(query: Pick<FeedQuery, "q" | "source" | "region" | "category">): string {
  return JSON.stringify({
    q: query.q?.toLocaleLowerCase() ?? "",
    source: [...sourceIds(query.source)].sort(),
    region: query.region ?? "",
    category: query.category ?? "",
  });
}

function sign(body: CursorBody, secret: string): string {
  return createHmac("sha256", secret).update(JSON.stringify(body)).digest("base64url");
}

export function encodeCursor(body: Omit<CursorBody, "v">, secret = process.env.CURSOR_SECRET ?? "local-development-only"): string {
  const unsigned: CursorBody = { v: cursorVersion, ...body };
  return Buffer.from(JSON.stringify({ ...unsigned, sig: sign(unsigned, secret) }), "utf8").toString("base64url");
}

export function decodeCursor(value: string, secret = process.env.CURSOR_SECRET ?? "local-development-only"): CursorPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid cursor");
  }

  const cursor = parsed as Partial<CursorPayload>;
  if (
    !cursor || cursor.v !== cursorVersion || typeof cursor.publishedAt !== "string" || typeof cursor.id !== "string"
    || typeof cursor.asOf !== "string" || typeof cursor.filters !== "string" || typeof cursor.sig !== "string"
  ) {
    throw new Error("Invalid cursor");
  }

  const { sig, ...unsigned } = cursor as CursorPayload;
  if (sign(unsigned, secret) !== sig) throw new Error("Invalid cursor");
  return cursor as CursorPayload;
}

function recordConditions(query: FeedQuery, asOf: Date, cursor?: CursorPayload): SQL[] {
  const conditions: SQL[] = [eq(feedRecords.status, "active"), lte(feedRecords.publishedAt, asOf)];
  const requestedSources = sourceIds(query.source);
  if (requestedSources.length) conditions.push(inArray(feedRecords.sourceId, requestedSources));
  if (query.region) conditions.push(eq(feedRecords.region, query.region));
  if (query.category) conditions.push(eq(feedRecords.category, query.category));
  if (query.q) {
    const term = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(feedRecords.title, term), ilike(feedRecords.excerpt, term))!);
  }
  if (cursor) {
    const publishedAt = new Date(cursor.publishedAt);
    conditions.push(or(
      lt(feedRecords.publishedAt, publishedAt),
      and(eq(feedRecords.publishedAt, publishedAt), lt(feedRecords.id, cursor.id)),
    )!);
  }
  return conditions;
}

function toFeedRecord(row: typeof feedRecords.$inferSelect) {
  return {
    id: row.id,
    sourceId: row.sourceId,
    title: row.title,
    excerpt: row.excerpt,
    author: row.author,
    canonicalUrl: row.canonicalUrl,
    region: row.region,
    category: row.category,
    language: row.language,
    publishedAt: row.publishedAt.toISOString(),
    score: row.score,
    comments: row.comments,
  };
}

async function healthSummary(db: Database) {
  const rows = await db.select({
    lastError: sourceHealth.lastError,
    lastSuccessAt: sourceHealth.lastSuccessAt,
  }).from(sourceHealth);

  return rows.reduce((summary, row) => {
    if (row.lastError) summary.failed += 1;
    else if (row.lastSuccessAt) summary.healthy += 1;
    else summary.empty += 1;
    return summary;
  }, { healthy: 0, empty: 0, failed: 0 });
}

export function buildApi(db: Database, cursorSecret = process.env.CURSOR_SECRET ?? "local-development-only"): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get("/health", async (_request, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { status: "ok", database: "ok" };
    } catch {
      return reply.code(503).send({ status: "degraded", database: "unavailable" });
    }
  });

  const getFeed = async (request: { query: unknown }, reply: { code: (status: number) => { send: (body: unknown) => unknown } }) => {
    const parsed = feedQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query", details: parsed.error.flatten() });

    const query = parsed.data;
    const filters = filterFingerprint(query);
    let cursor: CursorPayload | undefined;
    try {
      cursor = query.cursor ? decodeCursor(query.cursor, cursorSecret) : undefined;
    } catch {
      return reply.code(400).send({ error: "Invalid cursor" });
    }

    if (cursor && cursor.filters !== filters) return reply.code(400).send({ error: "Cursor does not match filters" });
    if (cursor && query.asOf && query.asOf !== cursor.asOf) return reply.code(400).send({ error: "Cursor does not match snapshot" });

    const asOf = new Date(cursor?.asOf ?? query.asOf ?? new Date().toISOString());
    if (Number.isNaN(asOf.getTime())) return reply.code(400).send({ error: "Invalid snapshot" });

    const rows = await db.select().from(feedRecords)
      .where(and(...recordConditions(query, asOf, cursor)))
      .orderBy(desc(feedRecords.publishedAt), desc(feedRecords.id))
      .limit(query.limit + 1);

    const hasMore = rows.length > query.limit;
    const items = rows.slice(0, query.limit);
    const last = items.at(-1);
    const nextCursor = hasMore && last
      ? encodeCursor({ publishedAt: last.publishedAt.toISOString(), id: last.id, asOf: asOf.toISOString(), filters }, cursorSecret)
      : null;

    return {
      data: items.map(toFeedRecord),
      page: { nextCursor, hasMore, asOf: asOf.toISOString() },
      meta: { sort: "published_at_desc", sourceHealth: await healthSummary(db) },
    };
  };

  app.get("/v1/feed", getFeed);
  app.get("/v1/records", getFeed);
  app.get("/api/feed", getFeed);

  const getTerminalOverview = async (request: { query: unknown }, reply: { code: (status: number) => { send: (body: unknown) => unknown } }) => {
    const parsed = terminalQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid query", details: parsed.error.flatten() });

    const query = parsed.data;
    const asOf = new Date(query.asOf ?? new Date().toISOString());
    const conditions: SQL[] = [eq(feedRecords.status, "active"), lte(feedRecords.publishedAt, asOf), sql`${feedRecords.region} is not null`];
    if (query.region) conditions.push(eq(feedRecords.region, query.region));
    if (query.category) conditions.push(eq(feedRecords.category, query.category));
    if (query.from) conditions.push(gte(feedRecords.publishedAt, new Date(query.from)));
    if (query.to) conditions.push(lte(feedRecords.publishedAt, new Date(query.to)));

    const rows = await db.select().from(feedRecords)
      .where(and(...conditions))
      .orderBy(desc(feedRecords.publishedAt), desc(feedRecords.id))
      .limit(query.limit);

    const byDay = new Map<string, number>();
    const byCategory = new Map<string, number>();
    const sourceCategory = new Map<string, Map<string, number>>();
    for (const row of rows) {
      const day = row.publishedAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
      if (row.category) byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + 1);
      const sourceCounts = sourceCategory.get(row.sourceId) ?? new Map<string, number>();
      if (row.category) sourceCounts.set(row.category, (sourceCounts.get(row.category) ?? 0) + 1);
      sourceCategory.set(row.sourceId, sourceCounts);
    }

    const health = await db.select({
      sourceId: sources.id,
      name: sources.name,
      homepageUrl: sources.homepageUrl,
      endpointUrl: sources.endpointUrl,
      region: sources.region,
      category: sources.category,
      lastSuccessAt: sourceHealth.lastSuccessAt,
      lastFinishedAt: sourceHealth.lastFinishedAt,
      lastItemCount: sourceHealth.lastItemCount,
      lastError: sourceHealth.lastError,
    }).from(sources).leftJoin(sourceHealth, eq(sourceHealth.sourceId, sources.id))
      .where(query.region ? eq(sources.region, query.region) : undefined)
      .orderBy(asc(sources.name));

    return {
      data: rows.map(toFeedRecord),
      asOf: asOf.toISOString(),
      overview: {
        activity: [...byDay.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, count]) => ({ date, count })),
        categories: [...byCategory.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([category, count]) => ({ category, count })),
        matrix: [...sourceCategory.entries()].map(([sourceId, categories]) => ({ sourceId, categories: Object.fromEntries(categories) })),
        sourceHealth: health,
      },
    };
  };

  app.get("/v1/terminal/overview", getTerminalOverview);
  app.get("/api/terminal", getTerminalOverview);

  app.get("/v1/health/sources", async () => ({
    data: await db.select({
      sourceId: sources.id,
      name: sources.name,
      homepageUrl: sources.homepageUrl,
      endpointUrl: sources.endpointUrl,
      region: sources.region,
      category: sources.category,
      lastStartedAt: sourceHealth.lastStartedAt,
      lastFinishedAt: sourceHealth.lastFinishedAt,
      lastSuccessAt: sourceHealth.lastSuccessAt,
      lastItemCount: sourceHealth.lastItemCount,
      consecutiveFailures: sourceHealth.consecutiveFailures,
      circuitOpenUntil: sourceHealth.circuitOpenUntil,
      lastError: sourceHealth.lastError,
    }).from(sources).leftJoin(sourceHealth, eq(sourceHealth.sourceId, sources.id)).orderBy(asc(sources.name)),
  }));

  return app;
}
