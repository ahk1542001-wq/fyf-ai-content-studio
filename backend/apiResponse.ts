import { NextResponse } from "next/server";

export type ApiErrorCode = "not_found" | "conflict" | "bad_request" | "internal_error";

const statusByCode: Record<ApiErrorCode, number> = {
  not_found: 404,
  conflict: 409,
  bad_request: 400,
  internal_error: 500
};

export function okJson<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function errorJson(code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        details
      }
    },
    { status: statusByCode[code] }
  );
}

export function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected API error";
  if (/workspace not found/i.test(message)) return errorJson("not_found", message, { code: "workspace_not_found" });
  if (/draft not found/i.test(message)) return errorJson("not_found", message, { code: "draft_not_found" });
  if (/integration setting not found/i.test(message)) return errorJson("not_found", message, { code: "integration_not_found" });
  if (/request body/i.test(message)) return errorJson("bad_request", message);
  if (/required/i.test(message)) return errorJson("bad_request", message);
  if (/voice mode/i.test(message)) return errorJson("bad_request", message);
  if (/must be approved/i.test(message)) return errorJson("conflict", message);
  if (/approval record/i.test(message)) return errorJson("conflict", message);
  if (/risk guard blocked/i.test(message)) return errorJson("conflict", message);
  if (/recoverable state/i.test(message)) return errorJson("conflict", message);
  if (/not found/i.test(message)) return errorJson("not_found", message);
  return errorJson("internal_error", "Internal server error");
}

export async function readJsonObject(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be a JSON object");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.message === "Request body must be a JSON object") throw error;
    throw new Error("Request body must be valid JSON");
  }
}

export function textField(body: Record<string, unknown>, key: string, fallback = "") {
  const value = body[key];
  return typeof value === "string" ? value : fallback;
}
