import "dotenv/config";
import { getConfig } from "../../../packages/config/src/index";
import { createDatabase } from "../../../packages/db/src/client";
import { buildApi } from "./server";

const config = getConfig();
const database = createDatabase(config.DATABASE_URL);
const app = buildApi(database.db);

await app.listen({ host: config.API_HOST, port: config.API_PORT });
const shutdown = async () => { await app.close(); await database.client.end(); };
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
