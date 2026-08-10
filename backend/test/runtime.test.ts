import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { createRuntime } from "../src/runtime.js";

describe("Midnight Preprod runtime boundary", () => {
  it("refuses an in-memory repository before it can create a live lifecycle worker", async () => {
    const config = loadConfig("test");
    config.anchorMode = "midnight-preprod";
    config.midnightWorkerDirectory = "C:\\unused-in-this-failure-path";
    config.databaseUrl = null;
    config.rdsIam = null;

    await expect(createRuntime(config)).rejects.toThrow(
      "DATABASE_URL or AQUA_RDS_IAM_AUTH is required for production or Midnight Preprod",
    );
  });
});
