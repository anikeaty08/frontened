import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const strict = process.argv.includes("--production");
const envFile = process.env.AQUA_PREFLIGHT_ENV_FILE ?? ".env";
if (envFile && existsSync(envFile)) process.loadEnvFile(envFile);

const requiredFiles = [
  "contracts/aqua-reserve-snapshot.compact",
  "contracts/README.md",
  "../frontend/package.json",
  "midnight/package.json",
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
];

const hasAny = (names) => names.some((name) => Boolean(process.env[name]));

const signingKeyCheck = (role) => {
  const privateNames = [`AQUA_${role}_ED25519_PRIVATE_KEY_PEM`, `AQUA_${role}_ED25519_PRIVATE_KEY_PEM_BASE64`];
  const publicNames = [`AQUA_${role}_ED25519_PUBLIC_KEY_PEM`, `AQUA_${role}_ED25519_PUBLIC_KEY_PEM_BASE64`];
  return {
    name: `${role.toLowerCase()} Ed25519 key pair`,
    passed: hasAny(privateNames) && hasAny(publicNames),
  };
};

const midnightWalletCheck = () => {
  const hasMnemonic = Boolean(process.env.MIDNIGHT_WALLET_MNEMONIC);
  const hasSeed = Boolean(process.env.MIDNIGHT_WALLET_SEED);
  return {
    name: "Midnight wallet credential (exactly one of mnemonic or seed)",
    passed: hasMnemonic !== hasSeed,
  };
};

const checks = requiredFiles.map((file) => ({ name: `required file: ${file}`, passed: existsSync(file) }));
const compactCheckCommand = process.env.AQUA_COMPACT_CHECK_COMMAND?.trim();
const compactCheckCommands = compactCheckCommand
  ? [compactCheckCommand]
  : [
      `${process.env.COMPACT_BIN ?? "compact"} --version`,
      ...(process.platform === "win32" ? ['wsl.exe -- bash -lc "compact --version"'] : []),
    ];
const compactc = compactCheckCommands
  .map((command) => spawnSync(command, { encoding: "utf8", shell: true }))
  .find((result) => result.status === 0);
checks.push({
  name: compactCheckCommand
    ? "Midnight Compact compiler (AQUA_COMPACT_CHECK_COMMAND)"
    : "Midnight Compact compiler used by the worker",
  passed: Boolean(compactc),
});

if (strict) {
  for (const name of requiredProductionEnvironment) checks.push({ name: `production environment: ${name}`, passed: Boolean(process.env[name]) });
  checks.push(signingKeyCheck("ISSUER"));
  checks.push(signingKeyCheck("ATTESTER"));
  checks.push({ name: "Midnight issuer authorisation secret", passed: Boolean(process.env.AQUA_MIDNIGHT_ISSUER_AUTH_SECRET_HEX) });
  checks.push({ name: "Midnight attester authorisation secret", passed: Boolean(process.env.AQUA_MIDNIGHT_ATTESTER_AUTH_SECRET_HEX) });
  checks.push({ name: "Midnight private-state password", passed: Boolean(process.env.AQUA_MIDNIGHT_PRIVATE_STATE_PASSWORD) });
  checks.push(midnightWalletCheck());
  checks.push({ name: "AQUA_RDS_IAM_AUTH enabled", passed: process.env.AQUA_RDS_IAM_AUTH === "true" });
  checks.push({ name: "MIDNIGHT_ANCHOR_MODE configured", passed: process.env.MIDNIGHT_ANCHOR_MODE === "midnight-preprod" });
  checks.push({ name: "Midnight worker package", passed: existsSync(`${process.env.AQUA_MIDNIGHT_WORKER_DIR ?? "midnight"}/package.json`) });
}

for (const check of checks) console.log(`${check.passed ? "PASS" : "FAIL"}  ${check.name}`);
if (checks.some((check) => !check.passed)) {
  console.error("\nPhase 1 is not deployable yet. See DEPLOYMENT.md; no secrets or credentials were printed.");
  process.exitCode = 1;
} else {
  console.log("\nPhase 1 preflight passed. Compile and test the Compact contract, then perform the controlled deployment steps in DEPLOYMENT.md.");
}
