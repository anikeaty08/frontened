import { NextRequest, NextResponse } from "next/server";

const demoEnabled = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.AQUA_LOCAL_DEMO_SESSION !== "false";

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: false,
  path: "/",
  maxAge: 60 * 60 * 2,
};

const sameOrigin = (request: NextRequest): boolean => {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
};

export async function GET() {
  return NextResponse.json({ enabled: demoEnabled() });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Origin rejected" }, { status: 403 });
  if (!demoEnabled())
    return NextResponse.json(
      { error: "Local demo sessions are disabled" },
      { status: 404 },
    );

  const body = (await request.json().catch(() => null)) as {
    role?: unknown;
    customerNumber?: unknown;
  } | null;
  const role = body?.role;
  let token: string;

  if (role === "ISSUER") token = "issuer-demo-token";
  else if (role === "ATTESTER") token = "attester-demo-token";
  else if (role === "CUSTOMER") {
    const customerNumber = body?.customerNumber;
    if (
      typeof customerNumber !== "number" ||
      !Number.isInteger(customerNumber) ||
      customerNumber < 1 ||
      customerNumber > 50
    ) {
      return NextResponse.json(
        { error: "A demo customer number from 1 to 50 is required" },
        { status: 400 },
      );
    }
    token = `customer-demo-token-${String(customerNumber).padStart(3, "0")}`;
  } else {
    return NextResponse.json(
      { error: "A supported demo role is required" },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ authenticated: true, role });
  response.cookies.set("aqua_access_token", token, cookieOptions);
  response.cookies.set("aqua_role", role, {
    ...cookieOptions,
    httpOnly: false,
  });
  return response;
}
