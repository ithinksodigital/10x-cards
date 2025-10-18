import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const baseConfig = tseslint.config({
  extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
  languageOptions: {
    globals: {
      process: "readonly",
    },
  },
  rules: {
    "no-console": "warn",
    "no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "no-empty": "error",
    "no-empty-function": "error",
    "no-constant-binary-expression": "error",
    "no-case-declarations": "error",
  },
});

const jsxA11yConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [jsxA11y.flatConfigs.recommended],
  languageOptions: {
    ...jsxA11y.flatConfigs.recommended.languageOptions,
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
  },
});

const reactConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [pluginReact.configs.flat.recommended],
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
    globals: {
      window: true,
      document: true,
    },
  },
  plugins: {
    "react-hooks": eslintPluginReactHooks,
    "react-compiler": reactCompiler,
  },
  settings: { react: { version: "detect" } },
  rules: {
    ...eslintPluginReactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react-compiler/react-compiler": "error",
  },
});

const testConfig = tseslint.config({
  files: ["**/*.test.{js,ts,tsx}", "**/*.spec.{js,ts,tsx}", "tests/**/*.{js,ts,tsx}"],
  rules: {
    "no-console": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "no-empty": "off",
    "no-empty-function": "off",
    "no-constant-binary-expression": "off",
    "no-case-declarations": "off",
  },
});

const astroInlineScriptConfig = tseslint.config({
  files: ["**/*.astro"],
  languageOptions: {
    globals: {
      window: "readonly",
      document: "readonly",
      URLSearchParams: "readonly",
      fetch: "readonly",
      localStorage: "readonly",
      sessionStorage: "readonly",
      setTimeout: "readonly",
    },
  },
});

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      ".ai/**/*.js",
      ".ai/**/*.ts",
      "html/**/*.js",
      "html/**/*.ts",
      "dist/**/*.js",
      "dist/**/*.ts",
      "coverage/**/*.js",
      "coverage/**/*.ts",
      "test-results/**/*.js",
      "test-results/**/*.ts",
      "playwright-report/**/*.js",
      "playwright-report/**/*.ts",
      "public/scripts/**/*.js",
      "src/pages/auth/callback.astro",
      "src/pages/auth/logout.astro",
    ],
  },
  baseConfig,
  jsxA11yConfig,
  reactConfig,
  testConfig,
  astroInlineScriptConfig,
  eslintPluginAstro.configs["flat/recommended"],
  eslintPluginPrettier
);
