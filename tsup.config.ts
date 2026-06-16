import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    target: "es2020",
    outDir: "dist",
  },
  {
    entry: {
      cli: "src/cli/index.ts",
    },
    format: ["cjs"],
    platform: "node",
    external: ["fast-glob", "prettier"],
    banner: {
      js: "#!/usr/bin/env node",
    },
    tsconfig: "./tsconfig.json", // Buộc tsup đọc tsconfig
  },
]);
