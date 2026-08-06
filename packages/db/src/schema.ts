import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const sourceChannelIds = ["rss", "api", "html", "manual"] as const;
export type SourceChannel = (typeof sourceChannelIds)[number];
export const sourceChannelEnum = pgEnum("source_channel", sourceChannelIds);

export const recordStatusIds = ["active", "hidden"] as const;
export const recordStatusEnum = pgEnum("record_status", recordStatusIds);

export const ingestionStatusIds = ["running", "succeeded", "partial", "failed"] as const;
export type IngestionStatus = (typeof ingestionStatusIds)[number];
export const ingestionStatusEnum = pgEnum("ingestion_status", ingestionStatusIds);

export const sources = pgTable(
  "sources",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    homepageUrl: text("homepage_url").notNull(),
    endpointUrl: text("endpoint_url").notNull(),
    channel: sourceChannelEnum("channel").notNull(),
    region: text("region"),
    category: text("category"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sources_enabled_idx").on(table.enabled)],
);

export const feedRecords = pgTable(
  "feed_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: text("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
    sourceItemKey: text("source_item_key").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    canonicalUrlHash: text("canonical_url_hash").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    author: text("author"),
    category: text("category"),
    region: text("region"),
    language: text("language"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    publishedPrecision: text("published_precision").notNull().default("exact"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    contentHash: text("content_hash").notNull(),
    status: recordStatusEnum("status").notNull().default("active"),
    score: integer("score"),
    comments: integer("comments"),
    rawMetadata: jsonb("raw_metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("feed_records_source_item_key_uidx").on(table.sourceId, table.sourceItemKey),
    uniqueIndex("feed_records_canonical_url_hash_uidx").on(table.canonicalUrlHash),
    index("feed_records_published_at_id_idx").on(table.publishedAt, table.id),
    index("feed_records_region_published_at_idx").on(table.region, table.publishedAt, table.id),
    index("feed_records_category_published_at_idx").on(table.category, table.publishedAt, table.id),
    index("feed_records_source_published_at_idx").on(table.sourceId, table.publishedAt, table.id),
  ],
);

export const sourceHealth = pgTable(
  "source_health",
  {
    sourceId: text("source_id").primaryKey().references(() => sources.id, { onDelete: "cascade" }),
    lastStartedAt: timestamp("last_started_at", { withTimezone: true }),
    lastFinishedAt: timestamp("last_finished_at", { withTimezone: true }),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    lastItemCount: integer("last_item_count").notNull().default(0),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    circuitOpenUntil: timestamp("circuit_open_until", { withTimezone: true }),
    lastError: text("last_error"),
  },
);

export const ingestionRuns = pgTable(
  "ingestion_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pipeline: text("pipeline").notNull().default("canonical-feed"),
    status: ingestionStatusEnum("status").notNull().default("running"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    sourceCount: integer("source_count").notNull().default(0),
    recordsSeen: integer("records_seen").notNull().default(0),
    recordsInserted: integer("records_inserted").notNull().default(0),
    error: text("error"),
  },
  (table) => [index("ingestion_runs_pipeline_started_at_idx").on(table.pipeline, table.startedAt)],
);

export const sourceRelations = relations(sources, ({ many, one }) => ({
  records: many(feedRecords),
  health: one(sourceHealth),
}));

export const feedRecordRelations = relations(feedRecords, ({ one }) => ({
  source: one(sources, { fields: [feedRecords.sourceId], references: [sources.id] }),
}));

export const sourceHealthRelations = relations(sourceHealth, ({ one }) => ({
  source: one(sources, { fields: [sourceHealth.sourceId], references: [sources.id] }),
}));

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type FeedRecord = typeof feedRecords.$inferSelect;
export type NewFeedRecord = typeof feedRecords.$inferInsert;
export type SourceHealth = typeof sourceHealth.$inferSelect;
export type IngestionRun = typeof ingestionRuns.$inferSelect;
