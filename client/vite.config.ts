import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";

import { defineConfig } from "vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Comment the babel block if you want to disable React Compiler optimizations (make sure to also make changes eslint.config.js)
      babel: {
        plugins: [
          [
            "babel-plugin-react-compiler",
            {
              target: "19",
              // Use "annotation" mode to only compile components with "use memo" directive
              compilationMode: "annotation"
              // This ensures only React components with explicit directives are optimized
              // Zustand stores and utility functions are safely excluded
            }
          ]
        ]
      }
    }),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  build: {
    outDir: "./dist",
    target: ["chrome90", "edge90", "es2022", "firefox89", "safari15"]
  }
});
