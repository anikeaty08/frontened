import type { ApiErrorBody, Role } from "./types";

export class ApiError extends Error {
  public constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
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
