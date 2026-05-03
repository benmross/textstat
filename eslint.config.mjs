import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party code:
    "public/vendor/**",
    "vendor/**",
    // Legacy vanilla JS:
    "legacy/**",
    // Worker (plain JS, not TS):
    "public/worker.js",
    "worker.js",
    // CommonJS test scripts:
    "*.cjs",
  ]),
]);

export default eslintConfig;
