import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/cli.ts"],
  format: ["esm"],
  clean: true,
  minify: true,
  // Fix for 'Dynamic require of "buffer" is not supported'
  // Seems to be working without it??
  /*banner: {
    js: `
    import path from 'path';
    import { fileURLToPath } from 'url';
    import { createRequire as topLevelCreateRequire } from 'module';
    const require = topLevelCreateRequire(import.meta.url);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    `,
  },*/
  ...options,
}));
