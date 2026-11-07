import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import netlifyPlugin from "@netlify/vite-plugin-tanstack-start";
import path from "path";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" }
    }),
    // Keep Netlify's deployment adapter out of local dev and preview servers.
    command === "build" && netlifyPlugin(),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    host: "localhost",
    port: 8081,
    strictPort: true
  },
  preview: {
    host: "localhost",
    port: 8081,
    strictPort: true
  }
}));
