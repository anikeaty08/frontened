import type { MerkleProofStep } from "../domain/types.js";
import { sha256 } from "./hash.js";

export interface MerkleLeaf {
  customerReference: string;
  balanceBaseUnits: bigint;
  salt: string;
}

interface Node {
  hash: string;
  leaves: number[];
}

export interface MerkleTree {
  root: string;
  total: bigint;
  proofs: Map<string, MerkleProofStep[]>;
}

const leafHash = (leaf: MerkleLeaf): string =>
  sha256(`aqua:liability-leaf:v1|${leaf.customerReference}|${leaf.balanceBaseUnits.toString()}|${leaf.salt}`);

const parentHash = (left: string, right: string): string => sha256(`aqua:liability-node:v1|${left}|${right}`);

export const buildMerkleTree = (leaves: MerkleLeaf[]): MerkleTree => {
  if (leaves.length === 0) {
    throw new Error("A liability set cannot be empty");
  }

  const proofs = new Map<string, MerkleProofStep[]>();
  for (const leaf of leaves) {
    proofs.set(leaf.customerReference, []);
  }

  let level: Node[] = leaves.map((leaf, index) => ({ hash: leafHash(leaf), leaves: [index] }));
  while (level.length > 1) {
    const nextLevel: Node[] = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      const right = level[index + 1] ?? left;
      if (!left || !right) {
        throw new Error("Merkle tree construction failed");
      }
      for (const leafIndex of left.leaves) {
        const reference = leaves[leafIndex]?.customerReference;
        if (!reference) throw new Error("Merkle tree leaf reference is missing");
        proofs.get(reference)?.push({ siblingHash: right.hash, siblingPosition: "RIGHT" });
      }
      if (right !== left) {
        for (const leafIndex of right.leaves) {
          const reference = leaves[leafIndex]?.customerReference;
          if (!reference) throw new Error("Merkle tree leaf reference is missing");
          proofs.get(reference)?.push({ siblingHash: left.hash, siblingPosition: "LEFT" });
        }
      }
      nextLevel.push({ hash: parentHash(left.hash, right.hash), leaves: [...left.leaves, ...right.leaves] });
    }
    level = nextLevel;
  }

  const root = level[0]?.hash;
  if (!root) throw new Error("Merkle root is missing");
  return {
    root,
    total: leaves.reduce((total, leaf) => total + leaf.balanceBaseUnits, 0n),
    proofs,
  };
};

export const verifyReceipt = (
  receipt: Pick<MerkleLeaf, "customerReference" | "balanceBaseUnits" | "salt"> & {
    membershipRoot: string;
    proof: MerkleProofStep[];
  },
): boolean => {
  let hash = leafHash(receipt);
  for (const step of receipt.proof) {
    hash = step.siblingPosition === "LEFT" ? parentHash(step.siblingHash, hash) : parentHash(hash, step.siblingHash);
  }
  return hash === receipt.membershipRoot;
};
