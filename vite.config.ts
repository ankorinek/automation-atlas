import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/panel.ts",
      formats: ["es"],
      fileName: () => "automation-atlas.js",
    },
    outDir: "dist",
    rollupOptions: {
      output: {
        // HA loads this as a single ES module with no external deps.
        inlineDynamicImports: false,
      },
    },
  },
});
