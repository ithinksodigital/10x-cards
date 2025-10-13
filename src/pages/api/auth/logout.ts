// src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
  const { error } = await supabase.auth.signOut();
  if (error) {
    return new Response(JSON.stringify({ error: 'logout_failed', message: error.message }), { status: 400 });
  }
  return new Response(null, { status: 200 });
};


