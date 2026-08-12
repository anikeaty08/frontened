import { NextRequest, NextResponse } from "next/server";

const allowed: ReadonlyArray<{ method: "GET" | "POST"; path: RegExp }> = [
  { method: "GET", path: /^health$/ },
  { method: "GET", path: /^ready$/ },
  { method: "GET", path: /^v1\/public\/snapshots(?:\/[0-9a-f-]{36})?$/ },
  { method: "POST", path: /^v1\/snapshots$/ },
  {
    method: "POST",
    path: /^v1\/snapshots\/[0-9a-f-]{36}\/(?:attest|revoke|reconcile)$/,
  },
  { method: "GET", path: /^v1\/snapshots\/[0-9a-f-]{36}\/events$/ },
  { method: "GET", path: /^v1\/issuer\/snapshots$/ },
  { method: "GET", path: /^v1\/issuer\/snapshots\/by-idempotency-key$/ },
  { method: "GET", path: /^v1\/attester\/snapshots$/ },
  {
    method: "GET",
    path: /^v1\/customer\/snapshots\/[0-9a-f-]{36}\/verification$/,
  },
];

const proxy = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) => {
  const path = (await context.params).path.join("/");
  if (
    !allowed.some(
      (route) => route.method === request.method && route.path.test(path),
    )
  ) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Route not found" } },
      { status: 404 },
    );
  }
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin)
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Origin rejected" } },
        { status: 403 },
      );
  }

  const apiBase =
    process.env.AQUA_API_URL ??
    process.env.NEXT_PUBLIC_AQUA_API_URL ??
    "http://127.0.0.1:3000";
  const upstream = new URL(path, `${apiBase.replace(/\/$/, "")}/`);
  upstream.search = request.nextUrl.search;
  const headers = new Headers({ accept: "application/json" });
  const token = request.cookies.get("aqua_access_token")?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey) headers.set("idempotency-key", idempotencyKey);

  try {
    const response = await fetch(upstream, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
      signal: AbortSignal.timeout(180_000),
    });
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "API_UNAVAILABLE",
          message: "AquaReserve API is unavailable",
        },
      },
      { status: 503 },
    );
  }
};

export const GET = proxy;
export const POST = proxy;
