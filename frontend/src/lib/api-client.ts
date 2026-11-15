/**
 * Browser-side API client.
 *
 * All calls go to the Next.js BFF proxy at /api/*, which attaches the
 * JWT from the httpOnly cookie and forwards to FastAPI. The browser never
 * sees the token and never talks to FastAPI directly.
 */

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ValidationIssue = { loc?: (string | number)[]; msg?: string };

/** FastAPI returns `detail` as a string, or as a list of issues for 422s. */
function parseError(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail;

  if (Array.isArray(detail)) {
    const fieldErrors: FieldErrors = {};
    for (const issue of detail as ValidationIssue[]) {
      const field = issue.loc?.[issue.loc.length - 1];
      if (field !== undefined && issue.msg) fieldErrors[String(field)] = issue.msg;
    }
    const first = (detail as ValidationIssue[])[0]?.msg ?? "Validation failed";
    return new ApiError(status, first, fieldErrors);
  }

  if (typeof detail === "string") return new ApiError(status, detail);
  return new ApiError(status, `Request failed (${status})`);
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  json?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", json, formData, query, signal } = options;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();

  const headers: HeadersInit = { Accept: "application/json" };
  let body: BodyInit | undefined;
  if (formData) {
    body = formData; // the browser sets the multipart boundary
  } else if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  const res = await fetch(`/api${path}${qs ? `?${qs}` : ""}`, { method, headers, body, signal });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw parseError(res.status, errorBody);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
