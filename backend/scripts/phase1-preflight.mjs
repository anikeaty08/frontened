import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const strict = process.argv.includes("--production");
const requiredFiles = [
  "contracts/aqua-reserve-snapshot.compact",
  "contracts/README.md",
  "web/package.json",
  "DEPLOYMENT.md",
];
const requiredProductionEnvironment = [
  "AQUA_WEB_ORIGIN",
  "AQUA_RDS_IAM_AUTH",
  "RDSHOST",
  "RDS_CA_CERT_PATH",
  "AQUA_MASTER_KEY_BASE64",
  "AQUA_CUSTOMER_REFERENCE_KEY_BASE64",
  "AQUA_AUTH_TOKENS_JSON",
  "AQUA_ISSUER_ED25519_PRIVATE_KEY_PEM",
  "AQUA_ISSUER_ED25519_PUBLIC_KEY_PEM",
  "AQUA_ATTESTER_ED25519_PRIVATE_KEY_PEM",
  "AQUA_ATTESTER_ED25519_PUBLIC_KEY_PEM",
  "MIDNIGHT_CONTRACT_ADDRESS",
  "MIDNIGHT_ANCHOR_SUBMIT_URL",
];

const checks = requiredFiles.map((file) => ({ name: `required file: ${file}`, passed: existsSync(file) }));
const compactCheckCommand = process.env.AQUA_COMPACT_CHECK_COMMAND?.trim();
const compactc = compactCheckCommand
  ? spawnSync(compactCheckCommand, { encoding: "utf8", shell: true })
  : spawnSync(process.env.COMPACTC_BIN ?? "compactc", ["--version"], { encoding: "utf8", shell: false });
checks.push({
  name: compactCheckCommand
    ? "Midnight Compact compiler (AQUA_COMPACT_CHECK_COMMAND)"
    : "Midnight Compact compiler (compactc)",
  passed: compactc.status === 0,
});

if (strict) {
  for (const name of requiredProductionEnvironment) checks.push({ name: `production environment: ${name}`, passed: Boolean(process.env[name]) });
  checks.push({ name: "AQUA_RDS_IAM_AUTH enabled", passed: process.env.AQUA_RDS_IAM_AUTH === "true" });
  checks.push({ name: "MIDNIGHT_ANCHOR_MODE configured", passed: process.env.MIDNIGHT_ANCHOR_MODE === "midnight-testnet" });
}

for (const check of checks) console.log(`${check.passed ? "PASS" : "FAIL"}  ${check.name}`);
if (checks.some((check) => !check.passed)) {
  console.error("\nPhase 1 is not deployable yet. See DEPLOYMENT.md; no secrets or credentials were printed.");
  process.exitCode = 1;
} else {
  console.log("\nPhase 1 preflight passed. Compile and test the Compact contract, then perform the controlled deployment steps in DEPLOYMENT.md.");
}
