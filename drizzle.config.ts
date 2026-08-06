import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "packages/db/src/schema.ts",
  out: "packages/db/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://signal:signal_dev_password@127.0.0.1:5432/signal",
  },
  strict: true,
  verbose: true,
});
