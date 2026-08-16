import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sirv from "sirv";
import { resolve } from "path";
import { readFile } from "node:fs/promises";

const dist = resolve(import.meta.dirname, "../../dist");

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    fs: { allow: [import.meta.dirname, dist] },
  },
  plugins: [
    react(),
    {
      name: "static-mounts",
      configureServer(server) {
        server.middlewares.use(
          "/json",
          sirv(resolve(dist, "json"), { dev: true }),
        );
        server.middlewares.use(
          "/extra_descriptions",
          sirv(resolve(dist, "extra_descriptions"), { dev: true }),
        );
        server.middlewares.use(
          "/vendor",
          sirv(resolve(dist, "vendor"), { dev: true }),
        );

        server.middlewares.use("/dist.json", async (_req, res, next) => {
          try {
            const buf = await readFile(resolve(dist, "dist.json"));
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Cache-Control", "no-store");
            res.end(buf);
          } catch {
            next();
          }
        });
      },
    },
  ],
});
