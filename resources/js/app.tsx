import "../css/app.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { initializePublicTheme } from "./lib/public-theme";
import { installPublicExtensions } from "./lib/public-integrations";
import { hydrate } from "./lib/constants";
import { setContent } from "./lib/content";

const appName = "Md Tanvir Hossain | eCommerce Architect & Automation Specialist";

createInertiaApp({
  title: (title) => (title ? `${title} | ${appName}` : appName),
  resolve: (name) =>
    resolvePageComponent(
      `./Pages/${name}.tsx`,
      import.meta.glob("./Pages/**/*.tsx"),
    ),
  setup({ el, App, props }) {
    const pageProps: any = props.initialPage.props;
    const content = pageProps?.content || [];
    const settings = pageProps?.settings;

    if (settings) {
      if (settings.appearance) {
        initializePublicTheme(settings.appearance);
      }
      hydrate({ settings, content });
      setContent({ settings, content });
    }
    if (typeof window !== "undefined" && settings) {
      requestAnimationFrame(() => installPublicExtensions(settings));
    }

    const root = createRoot(el);
    root.render(<App {...props} />);
  },
  progress: {
    color: "#dc143c",
    showSpinner: true,
  },
});
