import { loadConfig } from "./config.js";
import { createRuntime } from "./runtime.js";

const config = loadConfig();
const runtime = await createRuntime(config);
await runtime.app.listen({ port: config.port, host: config.host });

const shutdown = async (): Promise<void> => {
  await runtime.close();
  process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
