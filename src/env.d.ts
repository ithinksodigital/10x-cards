/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client.ts";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: { id: string; email: string | null } | null;
    }
  }
}

// Astro 5 environment variables schema
declare module "astro:env" {
  interface ImportMetaEnv {
    // Public client variables (available in both client and server)
    readonly PUBLIC_ENV_NAME: string;

    // Secret server variables (only available on server)
    readonly SUPABASE_URL: string;
    readonly SUPABASE_KEY: string;
    readonly OPENROUTER_API_KEY: string;
  }
}

// Legacy support for import.meta.env (fallback)
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly PUBLIC_ENV_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
