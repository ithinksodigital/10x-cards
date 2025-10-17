// src/pages/api/test-supabase.ts
import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../db/supabase.client";
import { getSecret } from "astro:env/server";
import { PUBLIC_ENV_NAME } from "astro:env/client";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // eslint-disable-next-line no-console
    console.log("Testing Supabase connection...");
    
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
    
    // Test 1: Check environment variables using Astro 5 system
    const envCheck = {
      // Check astro:env/server with getSecret
      astroEnvServer: {
        hasSupabaseUrl: !!getSecret("SUPABASE_URL"),
        hasSupabaseKey: !!getSecret("SUPABASE_KEY"),
        supabaseUrlLength: getSecret("SUPABASE_URL")?.length || 0,
        supabaseKeyLength: getSecret("SUPABASE_KEY")?.length || 0,
        supabaseUrlValue: getSecret("SUPABASE_URL") || "UNDEFINED",
        supabaseKeyValue: getSecret("SUPABASE_KEY") || "UNDEFINED",
        envName: PUBLIC_ENV_NAME,
      },
      // Legacy checks for comparison
      importMeta: {
        hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
        hasSupabaseKey: !!import.meta.env.SUPABASE_KEY,
        envName: import.meta.env.PUBLIC_ENV_NAME,
      },
      processEnv: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_KEY,
      },
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
