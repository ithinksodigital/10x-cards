// src/pages/api/auth/register.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { getSecret } from "astro:env/server";
import { PUBLIC_ENV_NAME } from "astro:env/client";

export const prerender = false;

const BodySchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = BodySchema.parse(body);

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    // Test Supabase connection
    await supabase.from("generations").select("id").limit(1);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: undefined },
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Supabase registration error:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      return new Response(JSON.stringify({ error: "registration_failed", message: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Registration endpoint error:", {
      error: err,
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    });
    const message = err instanceof Error ? err.message : "Invalid request";
    return new Response(JSON.stringify({ error: "bad_request", message }), { status: 400 });
  }
};
