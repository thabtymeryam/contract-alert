import { NextResponse } from "next/server";

import { BACKEND_API_URL, SESSION_COOKIE, sessionCookieOptions, tokenMaxAge } from "@/lib/server/session";

export async function POST(request: Request) {
  const credentials = await request.json().catch(() => null);

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_API_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ detail: "Backend unavailable" }, { status: 502 });
  }

  const body = await backendRes.json().catch(() => null);
  if (!backendRes.ok || !body?.access_token) {
    return NextResponse.json(body ?? { detail: "Login failed" }, { status: backendRes.status || 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, body.access_token, {
    ...sessionCookieOptions,
    maxAge: tokenMaxAge(body.access_token),
  });
  return res;
}
