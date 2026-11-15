/**
 * BFF proxy: /api/<path> -> FastAPI /api/<path>
 * Adds the Bearer token from the httpOnly session cookie. Clears the cookie
 * when FastAPI says the token is invalid, so middleware sends the user to /login.
 */
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { BACKEND_API_URL, SESSION_COOKIE } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "accept-language"];
// No content-length: fetch may have decoded a compressed body, so the original length would be wrong
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-disposition"];

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  // FastAPI's HTTPBearer answers a missing token with 403; normalise to 401 so the client redirects to login
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  // Rebuilt from params (already decoded) so a trailing slash survives: "/users/" stays "/users/"
  const trailingSlash = request.nextUrl.pathname.endsWith("/") ? "/" : "";
  const target = `${BACKEND_API_URL}/${params.path.map(encodeURIComponent).join("/")}${trailingSlash}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = !["GET", "HEAD"].includes(request.method);

  let backendRes: Response;
  try {
    backendRes = await fetch(target, {
      method: request.method,
      headers,
      // Buffered (not streamed) so FastAPI's trailing-slash 307 redirects can replay the body
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ detail: "Backend unavailable" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = backendRes.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const res = new NextResponse(backendRes.status === 204 ? null : backendRes.body, {
    status: backendRes.status,
    headers: responseHeaders,
  });
  if (backendRes.status === 401) res.cookies.delete(SESSION_COOKIE);
  return res;
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
