import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

export type DatabaseHandle = {
  db: Database;
  client: ReturnType<typeof postgres>;
};

export function createDatabase(databaseUrl = process.env.DATABASE_URL || "postgres://signal:signal_dev_password@127.0.0.1:5432/signal"): DatabaseHandle {

  const client = postgres(databaseUrl, {
    max: 10,
    prepare: false,
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}
