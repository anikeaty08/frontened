import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { describe, expect, it } from "vitest";
import { zkConfigDirectory } from "../src/providers.js";

describe("Compact ZK artifact configuration", () => {
  it("loads the issuer verifier key from the generated artifact directory", async () => {
    const provider = new NodeZkConfigProvider<string>(zkConfigDirectory);
    await expect(provider.getVerifierKey("assertIssuerAuthorised")).resolves.toBeInstanceOf(Uint8Array);
  });
});
