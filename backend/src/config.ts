import { createHash, randomBytes } from "node:crypto";
import { Ed25519EvidenceSigner, type SigningKeyPairPem } from "./crypto/signing.js";
import type { Principal } from "./domain/types.js";

export interface AquaConfig {
  environment: "development" | "test" | "production";
  port: number;
  host: string;
  webOrigin: string | null;
  databaseUrl: string | null;
  rdsIam: RdsIamConfig | null;
  masterKey: Buffer;
  customerReferenceKey: Buffer;
  demoAuthEnabled: boolean;
  tokens: Map<string, Principal>;
  anchorMode: "development" | "midnight-testnet";
  midnightContractAddress: string | null;
  issuerSigner: Ed25519EvidenceSigner;
  attesterSigner: Ed25519EvidenceSigner;
}

export interface RdsIamConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  region: string;
  caCertificatePath: string | null;
}

const keyFromEnvironment = (value: string | undefined, name: string, environment: AquaConfig["environment"]): Buffer => {
  if (value) {
    const decoded = Buffer.from(value, "base64");
    if (decoded.length !== 32) {
      throw new Error(`${name} must be a base64-encoded 32-byte key`);
    }
    return decoded;
  }

  if (environment === "production") {
    throw new Error(`${name} is required in production`);
  }

  return randomBytes(32);
};

const signerFromEnvironment = (prefix: "ISSUER" | "ATTESTER", environment: AquaConfig["environment"]): Ed25519EvidenceSigner => {
  const privateKeyPem = process.env[`AQUA_${prefix}_ED25519_PRIVATE_KEY_PEM`];
  const publicKeyPem = process.env[`AQUA_${prefix}_ED25519_PUBLIC_KEY_PEM`];
  if (privateKeyPem || publicKeyPem) {
    if (!privateKeyPem || !publicKeyPem) throw new Error(`AQUA_${prefix}_ED25519_PRIVATE_KEY_PEM and PUBLIC_KEY_PEM must be supplied together`);
    return Ed25519EvidenceSigner.fromPem({ privateKeyPem, publicKeyPem } satisfies SigningKeyPairPem);
  }
  if (environment === "production") throw new Error(`AQUA_${prefix}_ED25519_PRIVATE_KEY_PEM is required in production`);
  return Ed25519EvidenceSigner.createEphemeral();
};

export const loadConfig = (environmentOverride?: AquaConfig["environment"]): AquaConfig => {
  const rawEnvironment = environmentOverride ?? process.env.NODE_ENV ?? "development";
  if (rawEnvironment !== "development" && rawEnvironment !== "test" && rawEnvironment !== "production") {
    throw new Error("NODE_ENV must be development, test, or production");
  }

  const environment = rawEnvironment;
  const demoAuthEnabled = (process.env.AQUA_DEMO_AUTH ?? (environment === "production" ? "false" : "true")) === "true";
  if (environment === "production" && demoAuthEnabled) {
    throw new Error("AQUA_DEMO_AUTH must be false in production");
  }

  const tokens = new Map<string, Principal>();
  if (demoAuthEnabled) {
    tokens.set(process.env.AQUA_ISSUER_TOKEN ?? "issuer-demo-token", { id: "issuer-demo", roles: ["ISSUER"] });
    tokens.set(process.env.AQUA_ATTESTER_TOKEN ?? "attester-demo-token", { id: "attester-demo", roles: ["ATTESTER"] });
    for (let customer = 1; customer <= 50; customer += 1) {
      const customerId = `customer-${String(customer).padStart(3, "0")}`;
      tokens.set(`${process.env.AQUA_CUSTOMER_TOKEN_PREFIX ?? "customer-demo-token-"}${String(customer).padStart(3, "0")}`, {
        id: customerId,
        roles: ["CUSTOMER"],
      });
    }
  }

  const configuredTokens = process.env.AQUA_AUTH_TOKENS_JSON;
  if (configuredTokens) {
    const parsed: unknown = JSON.parse(configuredTokens);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("AQUA_AUTH_TOKENS_JSON must be an object keyed by token");
    }
    for (const [token, principal] of Object.entries(parsed)) {
      const candidate = principal as { id?: unknown; roles?: unknown };
      if (typeof candidate.id !== "string" || !Array.isArray(candidate.roles)) {
        throw new Error("AQUA_AUTH_TOKENS_JSON principals require id and roles");
      }
      if (!candidate.roles.every((role) => role === "ISSUER" || role === "ATTESTER" || role === "CUSTOMER")) {
        throw new Error("AQUA_AUTH_TOKENS_JSON contains an unsupported role");
      }
      tokens.set(token, { id: candidate.id, roles: candidate.roles as Principal["roles"] });
    }
  }

  if (environment === "production" && tokens.size === 0) {
    throw new Error("At least one authenticated principal is required in production");
  }

  const anchorMode = process.env.MIDNIGHT_ANCHOR_MODE ?? "development";
  if (anchorMode !== "development" && anchorMode !== "midnight-testnet") {
    throw new Error("MIDNIGHT_ANCHOR_MODE must be development or midnight-testnet");
  }
  if (environment === "production" && anchorMode !== "midnight-testnet") {
    throw new Error("MIDNIGHT_ANCHOR_MODE must be midnight-testnet in production");
  }
  const midnightContractAddress = anchorMode === "midnight-testnet" ? requiredEnvironment("MIDNIGHT_CONTRACT_ADDRESS") : null;

  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("PORT must be a valid TCP port");
  const webOrigin = process.env.AQUA_WEB_ORIGIN ?? (environment === "development" ? "http://localhost:3001" : null);
  if (webOrigin && !URL.canParse(webOrigin)) throw new Error("AQUA_WEB_ORIGIN must be an absolute URL");
  if (environment === "production" && !webOrigin) throw new Error("AQUA_WEB_ORIGIN is required in production");

  const rdsIamEnabled = process.env.AQUA_RDS_IAM_AUTH === "true";
  if (rdsIamEnabled && process.env.DATABASE_URL) throw new Error("Use either DATABASE_URL or AQUA_RDS_IAM_AUTH, not both");
  const rdsIam = rdsIamEnabled
    ? {
        host: requiredEnvironment("RDSHOST"),
        port: integerEnvironment("RDS_PORT", 5432),
        database: process.env.RDS_DATABASE ?? "postgres",
        username: process.env.RDS_USERNAME ?? "postgres",
        region: process.env.AWS_REGION ?? "ap-south-1",
        caCertificatePath: process.env.RDS_CA_CERT_PATH ?? null,
      }
    : null;
  if (environment === "production" && rdsIam && !rdsIam.caCertificatePath) {
    throw new Error("RDS_CA_CERT_PATH is required for production RDS IAM connections");
  }

  return {
    environment,
    port,
    host: process.env.HOST ?? (environment === "production" ? "0.0.0.0" : "127.0.0.1"),
    webOrigin,
    databaseUrl: process.env.DATABASE_URL ?? null,
    rdsIam,
    masterKey: keyFromEnvironment(process.env.AQUA_MASTER_KEY_BASE64, "AQUA_MASTER_KEY_BASE64", environment),
    customerReferenceKey: keyFromEnvironment(
      process.env.AQUA_CUSTOMER_REFERENCE_KEY_BASE64,
      "AQUA_CUSTOMER_REFERENCE_KEY_BASE64",
      environment,
    ),
    demoAuthEnabled,
    tokens,
    anchorMode,
    midnightContractAddress,
    issuerSigner: signerFromEnvironment("ISSUER", environment),
    attesterSigner: signerFromEnvironment("ATTESTER", environment),
  };
};

const requiredEnvironment = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const integerEnvironment = (name: string, fallback: number): number => {
  const value = Number.parseInt(process.env[name] ?? String(fallback), 10);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) throw new Error(`${name} must be a valid TCP port`);
  return value;
};

export const configurationFingerprint = (config: AquaConfig): string =>
  createHash("sha256")
    .update(`${config.environment}|${config.databaseUrl ?? "memory"}|${config.anchorMode}`)
    .digest("hex");
