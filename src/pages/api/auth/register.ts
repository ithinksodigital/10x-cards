// src/pages/api/auth/register.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const prerender = false;

const BodySchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // eslint-disable-next-line no-console
    console.log("Registration attempt - environment check:", {
      hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.SUPABASE_KEY,
      envName: import.meta.env.PUBLIC_ENV_NAME,
    });

    const body = await request.json();
    const { email, password } = BodySchema.parse(body);

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: undefined },
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Supabase registration error:", error);
      return new Response(JSON.stringify({ error: "registration_failed", message: error.message }), { status: 400 });
    }

    // eslint-disable-next-line no-console
    console.log("Registration successful for user:", data.user?.email);
    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Registration endpoint error:", err);
    const message = err instanceof Error ? err.message : "Invalid request";
    return new Response(JSON.stringify({ error: "bad_request", message }), { status: 400 });
  }
};
