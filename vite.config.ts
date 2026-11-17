import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import netlifyPlugin from "@netlify/vite-plugin-tanstack-start";
import path from "path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // The route code splitter builds import references from absolute paths;
      // disabling it avoids invalid JS when this checkout path contains an apostrophe.
      router: {
        autoCodeSplitting: false,
        codeSplittingOptions: { defaultBehavior: [] },
      },
      server: { entry: "server" }
    }),
    netlifyPlugin({
      dev: {
        edgeFunctions: { enabled: false },
      },
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 8080
  }
});
