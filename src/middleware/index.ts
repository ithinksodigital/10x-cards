import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";
import { isFeatureEnabled } from "../features";
import { PUBLIC_ENV_NAME } from "astro:env/client";

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
  try {
    // Check if auth feature is enabled
    const authEnabled = isFeatureEnabled("auth");

    // Attach per-request Supabase instance
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    locals.supabase = supabase;

    // Resolve user for SSR context only if auth is enabled
    let user = null;
    if (authEnabled) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
    }

    if (user) {
      locals.user = { id: user.id, email: user.email || null };
    } else {
      locals.user = null;
    }

    // Gate protected routes only if auth is enabled
    if (authEnabled) {
      const isPublic = PUBLIC_PATHS.has(url.pathname);
      const isProtected = url.pathname === "/" && !user;
      if (isProtected && !isPublic) {
        return redirect("/auth/login");
      }
    }

    return next();
  } catch (error) {
    // In test mode or when Supabase is not available, continue without auth
    // eslint-disable-next-line no-console
    console.warn("Supabase middleware error:", error);
    locals.supabase = null;
    locals.user = null;

    // Allow all requests in test mode
    if (import.meta.env.MODE === "test") {
      return next();
    }

    // In production, you might want to handle this differently
    throw error;
  }
});
