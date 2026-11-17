import {installPublicExtensions} from "./public-integrations";
import "./styles.css";
import { initializePublicTheme } from "./public-theme";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PublicLoading from "./components/PublicLoading";
import { hydrate } from "./constants";
import { setContent } from "./content";
const root = ReactDOM.createRoot(document.getElementById("root")!);
async function boot() {
  if (location.pathname.startsWith("/admin")) {
    const { default: Admin } = await import("./components/Admin");
    root.render(<Admin />);
    return;
  }
  if (new URLSearchParams(location.search).get("edit") === "1") {
    const session = await (await fetch("/api/auth/session")).json();
    if (!session.authenticated) {
      location.replace("/admin");
      return;
    }
    const { default: VisualEditor } = await import("./components/VisualEditor");
    root.render(<VisualEditor />);
    return;
  }
  root.render(<PublicLoading />);
  try {
    const response = await fetch("/api/public/site", { cache: "no-store" });
    if (!response.ok) throw Error();
    const data = await response.json();
    if (!data.settings.brand || !data.settings.homepage) throw Error();
    initializePublicTheme(data.settings.appearance);
    hydrate(data);
    setContent(data);
    if (new URLSearchParams(location.search).get("preview") === "design")
      window.parent.postMessage(
        { type: "portfolio-preview-ready" },
        location.origin,
      );
    document.title = data.settings.settings.siteTitle;
    if (data.settings.settings.favicon) {
      const icon = document.createElement("link");
      icon.rel = "icon";
      icon.href = data.settings.settings.favicon;
      document.head.appendChild(icon);
    }
    requestAnimationFrame(()=>installPublicExtensions(data.settings));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch {
    root.render(
      <main className="min-h-screen bg-black text-white grid place-items-center">
        <div role="alert">
          <h1>Website temporarily unavailable</h1>
          <p>Please try again shortly.</p>
          <button onClick={boot}>Retry</button>
        </div>
      </main>,
    );
  }
}
boot();
