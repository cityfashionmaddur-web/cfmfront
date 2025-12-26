import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_URL || "http://localhost:4000";

  return {
    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: target.startsWith("https"),
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      }
    }
  };
});
