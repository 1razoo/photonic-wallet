import { defineConfig } from "vite";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import react from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";
// import { comlink } from "vite-plugin-comlink";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [
    react({
      babel: {
        // useSignals hook is an alternative to signals-react-transform
        // If this plugin is removed @vitejs/plugin-react-swc can be used instead of Babel and @lingui/swc-plugin instead of macros
        plugins: ["module:@preact/signals-react-transform", "macros"],
      },
    }),
    lingui(),
    /*, comlink()*/
  ],
  // TODO
  /*worker: {
    plugins: [comlink()],
  },*/
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src"),
      "@ui": path.resolve(__dirname, "../ui/src"),
      "@lib": path.resolve(__dirname, "../lib/src"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      plugins: [NodeGlobalsPolyfillPlugin({ buffer: false })],
    },
  },
});
