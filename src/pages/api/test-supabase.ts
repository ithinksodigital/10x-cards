// src/pages/api/test-supabase.ts
import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // eslint-disable-next-line no-console
    console.log("Testing Supabase connection...");
    
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    
    // Test 1: Check environment variables
    const envCheck = {
      // Check import.meta.env
      importMeta: {
        hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.SUPABASE_KEY,
        envName: import.meta.env.PUBLIC_ENV_NAME,
        supabaseUrl: import.meta.env.SUPABASE_URL?.substring(0, 20) + "...",
      },
      // Check process.env (Cloudflare Pages)
      processEnv: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_KEY,
        envName: process.env.PUBLIC_ENV_NAME,
        supabaseUrl: process.env.SUPABASE_URL?.substring(0, 20) + "...",
      },
      // Check all available env keys
      allImportMetaKeys: Object.keys(import.meta.env),
      allProcessEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('OPENROUTER') || k.includes('PUBLIC')),
    };
    
    // Test 2: Try to query a table
    const { data: tableTest, error: tableError } = await supabase
      .from("generations")
      .select("id")
      .limit(1);
    
    // Test 3: Try to get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    return new Response(JSON.stringify({
      success: true,
      envCheck,
      tableTest: {
        success: !tableError,
        error: tableError?.message,
        data: tableTest,
      },
      userTest: {
        success: !userError,
        error: userError?.message,
        user: user ? { id: user.id, email: user.email } : null,
      },
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Test endpoint error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
