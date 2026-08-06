import "dotenv/config";
import { PgBoss } from "pg-boss";
import { getConfig } from "../../../packages/config/src/index";
import { ingestOnce } from "./ingest";

const queueName = "crawl-feed";
const config = getConfig();
const once = process.argv.includes("--once");

async function runOnce() {
  const result = await ingestOnce(config.DATABASE_URL);
  console.log(JSON.stringify({ event: "ingestion_complete", ...result, at: new Date().toISOString() }));
}

if (once) {
  await runOnce();
} else {
  const boss = new PgBoss(config.DATABASE_URL);
  boss.on("error", (error) => console.error("pg_boss_error", error));
  await boss.start();
  await boss.createQueue(queueName);
  await boss.schedule(queueName, "0,15,30,45 * * * *", null, {
    tz: "UTC",
    key: "quarter-hour",
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    expireInSeconds: 14 * 60,
  });
  await boss.work(queueName, { localConcurrency: 1 }, async () => {
    await runOnce();
  });
  await boss.send(queueName, {}, { singletonKey: "startup", singletonSeconds: 60, retryLimit: 3, retryDelay: 60, retryBackoff: true });

  const shutdown = async () => {
    await boss.stop();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
