// src/pages/api/auth/login.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { getSecret } from "astro:env/server";

export const prerender = false;

const BodySchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // eslint-disable-next-line no-console
    console.log("Login attempt - environment check:", {
      hasSupabaseUrl: !!getSecret("SUPABASE_URL"),
      hasSupabaseKey: !!getSecret("SUPABASE_KEY"),
      envName: import.meta.env.PUBLIC_ENV_NAME,
    });

    const body = await request.json();
    const { email, password } = BodySchema.parse(body);

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Supabase auth error:", error);
      return new Response(JSON.stringify({ error: "invalid_credentials", message: error.message }), { status: 400 });
    }

    // eslint-disable-next-line no-console
    console.log("Login successful for user:", data.user?.email);
    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Login endpoint error:", err);
    const message = err instanceof Error ? err.message : "Invalid request";
    return new Response(JSON.stringify({ error: "bad_request", message }), { status: 400 });
  }
};
