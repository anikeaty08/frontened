import { createInterface } from "node:readline";
import {
  executeLifecycle,
  checkpointWarmWalletSession,
  stopWarmWalletSession,
  type AttestInput,
  type DeployInput,
  type InspectInput,
  type LifecycleCommand,
  type RevokeInput,
} from "./cli.js";

// The backend owns this sidecar through stdin/stdout. Keeping the wallet in this
// process prevents a genesis-scale wallet scan for every lifecycle command.
process.env.MIDNIGHT_WALLET_SESSION = "warm";

type Request = {
  id: number;
  command: LifecycleCommand;
  payload?: DeployInput | AttestInput | RevokeInput | InspectInput;
};

const commands = new Set<LifecycleCommand>(["deploy", "attest", "revoke", "inspect", "status"]);
const reply = (value: Record<string, unknown>): void => { process.stdout.write(`${JSON.stringify(value)}\n`); };
const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

let closing = false;
const close = async (): Promise<void> => {
  if (closing) return;
  closing = true;
  await stopWarmWalletSession();
};

process.once("SIGTERM", () => { void close(); });
process.once("SIGINT", () => { void close(); });

const terminateAfterWalletFault = (reason: unknown): void => {
  console.error(`[wallet] unrecoverable runtime fault: ${errorMessage(reason)}`);
  void checkpointWarmWalletSession()
    .catch((checkpointError: unknown) => console.error(`[wallet] checkpoint recovery failed: ${errorMessage(checkpointError)}`))
    .finally(() => process.exit(1));
};
process.once("uncaughtException", terminateAfterWalletFault);
process.once("unhandledRejection", terminateAfterWalletFault);

const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of input) {
  let request: Partial<Request> = {};
  try {
    const candidate = JSON.parse(line) as Request;
    request = candidate;
    if (!Number.isSafeInteger(candidate.id) || !commands.has(candidate.command)) throw new Error("Invalid lifecycle daemon request");
    const result = await executeLifecycle(candidate.command, candidate.payload);
    reply({ id: candidate.id, ok: true, result });
  } catch (error) {
    reply({ id: request?.id ?? null, ok: false, error: errorMessage(error) });
  }
}
await close();
