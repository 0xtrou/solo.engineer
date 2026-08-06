import { and, eq, sql } from "drizzle-orm";
import { collectRecords, getSourceDefinitions, type NormalizedRecord } from "../../../packages/adapters/src/index";
import { createDatabase } from "../../../packages/db/src/client";
import { feedRecords, ingestionRuns, sourceHealth, sources } from "../../../packages/db/src/schema";

const circuitFailureLimit = 5;
const circuitOpenMs = 60 * 60 * 1_000;

type RawStatus = {
  sourceId?: string;
  source?: string;
  name?: string;
  endpoint?: string;
  region?: string;
  category?: string;
  loaded?: boolean;
  itemCount?: number;
  message?: string;
};

async function registerSources(database: ReturnType<typeof createDatabase>, records: NormalizedRecord[]) {
  const definitions = new Map(getSourceDefinitions().map((source) => [source.id, source]));
  for (const record of records) {
    if (!definitions.has(record.sourceId)) {
      definitions.set(record.sourceId, {
        id: record.sourceId,
        name: record.sourceName,
        homepageUrl: record.sourceHomepage,
        endpointUrl: record.sourceHomepage,
        channel: "manual",
        region: record.region,
        category: record.category,
      });
    }
  }

  for (const source of definitions.values()) {
    await database.db.insert(sources).values(source).onConflictDoUpdate({
      target: sources.id,
      set: {
        name: source.name,
        homepageUrl: source.homepageUrl,
        endpointUrl: source.endpointUrl,
        channel: source.channel,
        region: source.region,
        category: source.category,
        updatedAt: new Date(),
      },
    });
  }
}

async function writeRecord(database: ReturnType<typeof createDatabase>, record: NormalizedRecord): Promise<boolean> {
  const now = new Date();
  const values = {
    sourceId: record.sourceId,
    sourceItemKey: record.sourceItemKey,
    canonicalUrl: record.canonicalUrl,
    canonicalUrlHash: record.canonicalUrlHash,
    title: record.title,
    excerpt: record.excerpt,
    author: record.author,
    category: record.category,
    region: record.region,
    language: record.language,
    publishedAt: new Date(record.publishedAt),
    publishedPrecision: "exact",
    lastSeenAt: now,
    contentHash: record.contentHash,
    score: record.score,
    comments: record.comments,
    rawMetadata: record.rawMetadata,
    updatedAt: now,
  };

  const inserted = await database.db.insert(feedRecords).values(values).onConflictDoNothing().returning({ id: feedRecords.id });
  if (inserted.length) return true;

  const updatedBySourceKey = await database.db.update(feedRecords).set(values).where(and(
    eq(feedRecords.sourceId, record.sourceId),
    eq(feedRecords.sourceItemKey, record.sourceItemKey),
  )).returning({ id: feedRecords.id });
  if (updatedBySourceKey.length) return false;

  await database.db.update(feedRecords).set({ lastSeenAt: now, updatedAt: now }).where(
    eq(feedRecords.canonicalUrlHash, record.canonicalUrlHash),
  );
  return false;
}

async function updateSourceHealth(database: ReturnType<typeof createDatabase>, statuses: unknown[], records: NormalizedRecord[], startedAt: Date, finishedAt: Date) {
  for (const raw of statuses) {
    const status = raw as RawStatus;
    const sourceId = status.sourceId ?? status.source;
    if (!sourceId) continue;

    const previous = await database.db.select({ consecutiveFailures: sourceHealth.consecutiveFailures })
      .from(sourceHealth).where(eq(sourceHealth.sourceId, sourceId)).limit(1);
    const loaded = status.loaded === true;
    const consecutiveFailures = loaded ? 0 : (previous[0]?.consecutiveFailures ?? 0) + 1;
    const circuitOpenUntil = !loaded && consecutiveFailures >= circuitFailureLimit ? new Date(finishedAt.getTime() + circuitOpenMs) : null;

    await database.db.insert(sourceHealth).values({
      sourceId,
      lastStartedAt: startedAt,
      lastFinishedAt: finishedAt,
      lastSuccessAt: loaded ? finishedAt : null,
      lastItemCount: status.itemCount ?? records.filter((record) => record.sourceId === sourceId).length,
      consecutiveFailures,
      circuitOpenUntil,
      lastError: loaded ? null : status.message ?? "Source unavailable",
    }).onConflictDoUpdate({
      target: sourceHealth.sourceId,
      set: {
        lastStartedAt: startedAt,
        lastFinishedAt: finishedAt,
        lastSuccessAt: loaded ? finishedAt : undefined,
        lastItemCount: status.itemCount ?? records.filter((record) => record.sourceId === sourceId).length,
        consecutiveFailures,
        circuitOpenUntil,
        lastError: loaded ? null : status.message ?? "Source unavailable",
      },
    });
  }
}

export async function ingestOnce(databaseUrl: string): Promise<{ seen: number; inserted: number; status: "succeeded" | "partial" }> {
  const database = createDatabase(databaseUrl);
  const [lock] = await database.db.execute<{ locked: boolean }>(sql`select pg_try_advisory_lock(91827364) as locked`);
  if (!lock?.locked) {
    await database.client.end();
    return { seen: 0, inserted: 0, status: "partial" };
  }
  const startedAt = new Date();
  const [run] = await database.db.insert(ingestionRuns).values({ status: "running", startedAt }).returning({ id: ingestionRuns.id });

  try {
    const collected = await collectRecords();
    const finishedAt = new Date();
    await registerSources(database, collected.records);

    let inserted = 0;
    for (const record of collected.records) {
      if (await writeRecord(database, record)) inserted += 1;
    }

    await updateSourceHealth(database, collected.statuses, collected.records, startedAt, finishedAt);
    const partial = collected.statuses.some((raw) => (raw as RawStatus).loaded === false);
    const status = partial ? "partial" as const : "succeeded" as const;
    await database.db.update(ingestionRuns).set({
      status,
      finishedAt,
      sourceCount: collected.statuses.length,
      recordsSeen: collected.records.length,
      recordsInserted: inserted,
    }).where(eq(ingestionRuns.id, run.id));
    return { seen: collected.records.length, inserted, status };
  } catch (error) {
    await database.db.update(ingestionRuns).set({
      status: "failed",
      finishedAt: new Date(),
      error: error instanceof Error ? error.message : "Ingestion failed",
    }).where(eq(ingestionRuns.id, run.id));
    throw error;
  } finally {
    await database.db.execute(sql`select pg_advisory_unlock(91827364)`);
    await database.client.end();
  }
}
