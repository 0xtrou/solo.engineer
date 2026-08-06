import { z } from "zod";

const configSchema = z.object({
  DATABASE_URL: z.string().url().default("postgres://signal:signal_dev_password@127.0.0.1:5432/signal"),
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().positive().default(3003),
  INGEST_INTERVAL_MS: z.coerce.number().int().positive().default(900000),
});

export type AppConfig = z.infer<typeof configSchema>;
export function getConfig(env: NodeJS.ProcessEnv = process.env): AppConfig { return configSchema.parse(env); }
