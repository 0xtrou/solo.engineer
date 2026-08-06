CREATE TYPE "source_channel" AS ENUM ('rss', 'api', 'html', 'manual');
--> statement-breakpoint
CREATE TYPE "record_status" AS ENUM ('active', 'hidden');
--> statement-breakpoint
CREATE TYPE "ingestion_status" AS ENUM ('running', 'succeeded', 'partial', 'failed');
--> statement-breakpoint
CREATE TABLE "sources" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "homepage_url" text NOT NULL,
  "endpoint_url" text NOT NULL,
  "channel" "source_channel" NOT NULL,
  "region" text,
  "category" text,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_id" text NOT NULL,
  "source_item_key" text NOT NULL,
  "canonical_url" text NOT NULL,
  "canonical_url_hash" text NOT NULL,
  "title" text NOT NULL,
  "excerpt" text,
  "author" text,
  "category" text,
  "region" text,
  "language" text,
  "published_at" timestamp with time zone NOT NULL,
  "published_precision" text DEFAULT 'exact' NOT NULL,
  "first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "content_hash" text NOT NULL,
  "status" "record_status" DEFAULT 'active' NOT NULL,
  "score" integer,
  "comments" integer,
  "raw_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_health" (
  "source_id" text PRIMARY KEY NOT NULL,
  "last_started_at" timestamp with time zone,
  "last_finished_at" timestamp with time zone,
  "last_success_at" timestamp with time zone,
  "last_item_count" integer DEFAULT 0 NOT NULL,
  "consecutive_failures" integer DEFAULT 0 NOT NULL,
  "circuit_open_until" timestamp with time zone,
  "last_error" text
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pipeline" text DEFAULT 'canonical-feed' NOT NULL,
  "status" "ingestion_status" DEFAULT 'running' NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finished_at" timestamp with time zone,
  "source_count" integer DEFAULT 0 NOT NULL,
  "records_seen" integer DEFAULT 0 NOT NULL,
  "records_inserted" integer DEFAULT 0 NOT NULL,
  "error" text
);
--> statement-breakpoint
ALTER TABLE "feed_records" ADD CONSTRAINT "feed_records_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "source_health" ADD CONSTRAINT "source_health_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE cascade;
--> statement-breakpoint
CREATE INDEX "sources_enabled_idx" ON "sources" USING btree ("enabled");
--> statement-breakpoint
CREATE UNIQUE INDEX "feed_records_source_item_key_uidx" ON "feed_records" USING btree ("source_id", "source_item_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "feed_records_canonical_url_hash_uidx" ON "feed_records" USING btree ("canonical_url_hash");
--> statement-breakpoint
CREATE INDEX "feed_records_published_at_id_idx" ON "feed_records" USING btree ("published_at" DESC, "id" DESC);
--> statement-breakpoint
CREATE INDEX "feed_records_region_published_at_idx" ON "feed_records" USING btree ("region", "published_at" DESC, "id" DESC);
--> statement-breakpoint
CREATE INDEX "feed_records_category_published_at_idx" ON "feed_records" USING btree ("category", "published_at" DESC, "id" DESC);
--> statement-breakpoint
CREATE INDEX "feed_records_source_published_at_idx" ON "feed_records" USING btree ("source_id", "published_at" DESC, "id" DESC);
--> statement-breakpoint
CREATE INDEX "ingestion_runs_pipeline_started_at_idx" ON "ingestion_runs" USING btree ("pipeline", "started_at" DESC);
