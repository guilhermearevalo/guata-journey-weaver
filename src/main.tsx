import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { I18nProvider } from "./lib/i18n";
import "./index.css";

// Após deploy na Vercel, abas antigas podem pedir chunks com hash antigo (404). Recarrega uma vez.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </HelmetProvider>,
);
