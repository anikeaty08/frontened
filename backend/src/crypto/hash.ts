import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const encode = (value: string): Buffer => Buffer.from(value, "utf8");

export const sha256 = (value: string): string => createHash("sha256").update(encode(value)).digest("hex");

export const hmacSha256 = (key: Buffer, value: string): string => createHmac("sha256", key).update(encode(value)).digest("hex");

export const randomHex = (bytes = 16): string => randomBytes(bytes).toString("hex");

export const constantTimeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};
