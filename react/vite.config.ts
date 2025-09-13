import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import sirv from "sirv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dist = resolve(__dirname, "../../dist");

export default defineConfig({
  server: {
    fs: { allow: [__dirname, resolve(__dirname, "../../dist")] },
  },
  plugins: [
    react(),
    tsconfigPaths(),
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
