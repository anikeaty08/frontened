import { NextRequest, NextResponse } from "next/server";

const roles = new Set(["ISSUER", "ATTESTER", "CUSTOMER"]);
const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 8,
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json({ error: "Origin rejected" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as {
    token?: unknown;
    role?: unknown;
  } | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (
    !body ||
    token.length < 12 ||
    token.length > 512 ||
    /[\u0000-\u001f\u007f]/.test(token) ||
    typeof body.role !== "string" ||
    !roles.has(body.role)
  ) {
    return NextResponse.json(
      { error: "A valid access credential and role are required" },
      { status: 400 },
    );
  }
  const response = NextResponse.json({ authenticated: true, role: body.role });
  response.cookies.set("aqua_access_token", token, cookieOptions);
  response.cookies.set("aqua_role", body.role, {
    ...cookieOptions,
    httpOnly: false,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json({ error: "Origin rejected" }, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set("aqua_access_token", "", {
    ...cookieOptions,
    maxAge: 0,
  });
  response.cookies.set("aqua_role", "", {
    ...cookieOptions,
    httpOnly: false,
    maxAge: 0,
  });
  return response;
}
