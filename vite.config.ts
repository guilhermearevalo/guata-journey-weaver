import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Fail production builds loudly when the backend connection values are missing,
  // instead of shipping a site that crashes with "supabaseUrl is required".
  // Only enforced on Vercel; Lovable preview builds inject these values separately.
  if (command === "build" && process.env.VERCEL) {
    const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
    const missing = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"].filter(
      (k) => !String(env[k] ?? "").trim(),
    );
    if (missing.length) {
      throw new Error(
        `\n\n[Guatá] Build interrompido: faltam as variáveis ${missing.join(", ")}.\n` +
          `No Vercel: Settings → Environment Variables → adicione-as para "Production" e faça Redeploy (sem cache).\n`,
      );
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime"],
    },
    optimizeDeps: {
      include: ["@tanstack/react-query"],
    },
  };
});
