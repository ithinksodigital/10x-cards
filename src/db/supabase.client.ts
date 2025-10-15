import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn("Supabase environment variables are not set. Using mock values for development.");
}

export const supabaseClient = createClient<Database>(
  supabaseUrl || "https://mock.supabase.co",
  supabaseAnonKey || "mock-anon-key"
);

export type SupabaseClient = typeof supabaseClient;

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: false, // Changed to false for localhost testing
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader
    .split(";")
    .map((cookie) => {
      const [name, ...rest] = cookie.trim().split("=");
      return { name, value: rest.join("=") };
    })
    .filter((c) => c.name);
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const url = import.meta.env.SUPABASE_URL || "https://mock.supabase.co";
  const key = import.meta.env.SUPABASE_KEY || "mock-anon-key";

  const supabase = createServerClient<Database>(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
