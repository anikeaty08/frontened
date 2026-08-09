import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, type KeyObject } from "node:crypto";
import { canonicalJson } from "./hash.js";

export interface EvidenceSigner {
  sign(payload: unknown): string;
  verify(payload: unknown, signature: string): boolean;
  publicKeyPem(): string;
}

export interface SigningKeyPairPem {
  privateKeyPem: string;
  publicKeyPem: string;
}

export class Ed25519EvidenceSigner implements EvidenceSigner {
  public constructor(
    private readonly privateKey: KeyObject,
    private readonly publicKey: KeyObject,
  ) {}

  public static fromPem(keys: SigningKeyPairPem): Ed25519EvidenceSigner {
    return new Ed25519EvidenceSigner(createPrivateKey(keys.privateKeyPem), createPublicKey(keys.publicKeyPem));
  }

  public static createEphemeral(): Ed25519EvidenceSigner {
    const keys = generateKeyPairSync("ed25519");
    return new Ed25519EvidenceSigner(keys.privateKey, keys.publicKey);
  }

  public sign(payload: unknown): string {
    return sign(null, Buffer.from(canonicalJson(payload), "utf8"), this.privateKey).toString("base64url");
  }

  public verify(payload: unknown, signature: string): boolean {
    return verify(null, Buffer.from(canonicalJson(payload), "utf8"), this.publicKey, Buffer.from(signature, "base64url"));
  }

  public publicKeyPem(): string {
    return this.publicKey.export({ type: "spki", format: "pem" }).toString();
  }
}
