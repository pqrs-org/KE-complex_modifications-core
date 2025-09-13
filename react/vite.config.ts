// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import sirv from "sirv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  server: {
    fs: { allow: [__dirname, resolve(__dirname, "../../public")] },
  },
  plugins: [
    react(),
    tsconfigPaths(),
    {
      name: "static-extra-descriptions",
      configureServer(server) {
        server.middlewares.use(
          "/extra_descriptions",
          sirv(resolve(__dirname, "../../public/extra_descriptions"), {
            dev: true,
          }),
        );
      },
    },
  ],
});
