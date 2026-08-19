import type { ApiErrorBody, Role, SnapshotStatus } from "./types";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  public constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    cache: "no-store",
    headers: { accept: "application/json", ...init.headers },
  });
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error?.code ?? "REQUEST_FAILED",
      body.error?.message ?? "The request could not be completed.",
    );
  }
  return body;
}

export async function createSession(token: string, role: Role): Promise<void> {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, role }),
  });
  if (!response.ok)
    throw new Error("The access credential could not be stored securely.");
}

export async function demoSessionAvailable(): Promise<boolean> {
  const response = await fetch("/api/demo-session", { cache: "no-store" });
  if (!response.ok) return false;
  const body = (await response.json()) as { enabled?: unknown };
  return body.enabled === true;
}

export async function createDemoSession(
  role: Role,
  customerNumber?: number,
): Promise<void> {
  const response = await fetch("/api/demo-session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ role, customerNumber }),
  });
  if (!response.ok)
    throw new Error("The local demo session could not be established.");
}

export async function clearSession(): Promise<void> {
  await fetch("/api/session", { method: "DELETE" });
}

export const formatDate = (value: string | null): string =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not available";

export const compactHash = (value: string | null, size = 8): string =>
  value ? `${value.slice(0, size)}...${value.slice(-size)}` : "Not available";

export const snapshotFreshness = (
  status: SnapshotStatus,
  expiresAt: string,
  now = new Date(),
): { label: string; tone: "current" | "warning" | "unavailable" } => {
  if (status === "REVOKED") return { label: "Revoked", tone: "warning" };
  if (status === "UNAVAILABLE" || status === "INVALID")
    return { label: "Unavailable", tone: "unavailable" };

  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime()))
    return { label: "Unavailable", tone: "unavailable" };
  if (status === "EXPIRED" || expiry <= now)
    return { label: `Expired ${formatDate(expiresAt)}`, tone: "warning" };

  return { label: `Current until ${formatDate(expiresAt)}`, tone: "current" };
};
