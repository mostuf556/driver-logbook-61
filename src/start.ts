import { createStart, createMiddleware, createCsrfMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

// ─── CORS ────────────────────────────────────────────────────────────────────
// Set ALLOWED_ORIGINS (comma-separated) to permit cross-origin frontends to
// call server functions and reach the database.
// Example: https://smart-driver-daily.lovable.app,https://myapp.example.com
function getAllowedOrigins(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function buildCorsHeaders(requestOrigin: string | null): HeadersInit {
  const allowed = getAllowedOrigins();
  if (!requestOrigin || !allowed.has(requestOrigin)) return {};
  return {
    "Access-Control-Allow-Origin": requestOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-csrf-token",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

const corsMiddleware = createMiddleware().server(async ({ next, request }) => {
  const origin = request.headers.get("origin");

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(origin),
    });
  }

  const result = await next();
  const corsHeaders = buildCorsHeaders(origin);
  if (!Object.keys(corsHeaders).length) return result;

  // Attach CORS headers — cast through unknown since the TS type is opaque
  // but the runtime value is always a standard Response.
  const res = result as unknown as Response;
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  }) as unknown as typeof result;
});

// ─── CSRF ────────────────────────────────────────────────────────────────────
// Skip CSRF check for origins we explicitly trust via ALLOWED_ORIGINS so those
// frontends can call server functions without the same-origin restriction.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => {
    if (ctx.handlerType !== "serverFn") return false;
    const origin = (ctx.request as Request).headers.get("origin");
    if (origin && getAllowedOrigins().has(origin)) return false; // trusted — skip CSRF
    return true;
  },
});

// ─── Error handling ──────────────────────────────────────────────────────────
const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [corsMiddleware, csrfMiddleware, errorMiddleware],
}));
