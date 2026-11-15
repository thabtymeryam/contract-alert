import "server-only";

/** Where FastAPI lives, as seen from the Next.js server (not the browser). */
export const BACKEND_API_URL = (process.env.BACKEND_API_URL ?? "http://localhost:8000/api").replace(
  /\/$/,
  "",
);

export const SESSION_COOKIE = "ca_session";

/** Read `exp` from the JWT payload so the cookie expires with the token. No verification here — FastAPI does that. */
export function tokenMaxAge(token: string): number | undefined {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    const seconds = Math.floor(payload.exp - Date.now() / 1000);
    return seconds > 0 ? seconds : undefined;
  } catch {
    return undefined;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
