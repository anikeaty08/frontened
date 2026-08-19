import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
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

  it("accepts a single-line base64 PEM signing-key configuration", () => {
    const privateName = "AQUA_ISSUER_ED25519_PRIVATE_KEY_PEM_BASE64";
    const publicName = "AQUA_ISSUER_ED25519_PUBLIC_KEY_PEM_BASE64";
    const originalPrivate = process.env[privateName];
    const originalPublic = process.env[publicName];
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    process.env[privateName] = Buffer.from(privateKey.export({ format: "pem", type: "pkcs8" })).toString("base64");
    process.env[publicName] = Buffer.from(publicKey.export({ format: "pem", type: "spki" })).toString("base64");

    try {
      expect(loadConfig("test").issuerSigner.publicKeyPem()).toContain("BEGIN PUBLIC KEY");
    } finally {
      restoreEnvironment(privateName, originalPrivate);
      restoreEnvironment(publicName, originalPublic);
    }
  });

  it("rejects weak configured bearer tokens", () => {
    const name = "AQUA_AUTH_TOKENS_JSON";
    const original = process.env[name];
    process.env[name] = JSON.stringify({ short: { id: "issuer", roles: ["ISSUER"] } });
    try {
      expect(() => loadConfig("test")).toThrow("at least 32 characters");
    } finally {
      restoreEnvironment(name, original);
    }
  });
});

const restoreEnvironment = (name: string, value: string | undefined): void => {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
};
