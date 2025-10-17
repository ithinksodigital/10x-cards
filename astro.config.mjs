// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://10x-cards.pages.dev", // Cloudflare Pages domain
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  // Astro 5 environment variables configuration
  env: {
    schema: {
      // Public client variables (available in both client and server)
      PUBLIC_ENV_NAME: {
        context: "client",
        access: "public",
        type: "string",
        default: "local",
      },
      // Secret server variables (only available on server)
      SUPABASE_URL: {
        context: "server",
        access: "secret",
        type: "string",
      },
      SUPABASE_KEY: {
        context: "server",
        access: "secret",
        type: "string",
      },
      OPENROUTER_API_KEY: {
        context: "server",
        access: "secret",
        type: "string",
      },
    },
  },
});
