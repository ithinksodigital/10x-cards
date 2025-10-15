import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

const PUBLIC_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/logout",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/generations", // Allow anonymous generation
]);

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Attach per-request Supabase instance
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
  locals.supabase = supabase;

  // Resolve user for SSR context
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    locals.user = { id: user.id, email: user.email };
  } else {
    locals.user = null;
  }

  // Gate protected routes (basic example, extend as needed)
  const isPublic = PUBLIC_PATHS.has(url.pathname);
  const isProtected = url.pathname.startsWith("/dashboard");
  if (isProtected && !user && !isPublic) {
    return redirect("/auth/login");
  }

  return next();
});
