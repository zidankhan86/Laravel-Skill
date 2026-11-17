"use client";

import React, { useEffect } from "react";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import { initializePublicTheme } from "@/lib/public-theme";
import { installPublicExtensions } from "@/lib/public-integrations";

interface SiteInitializerProps {
  data: any;
  children: React.ReactNode;
}

export default function SiteInitializer({ data, children }: SiteInitializerProps) {
  // Sync state synchronously before rendering children
  if (data) {
    hydrate(data);
    setContent(data);
  }

  useEffect(() => {
    if (data?.settings?.appearance) {
      initializePublicTheme(data.settings.appearance);
    }
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preview") === "design" &&
      window.parent !== window
    ) {
      window.parent.postMessage(
        { type: "portfolio-preview-ready" },
        window.location.origin,
      );
    }
    if (data?.settings) {
      requestAnimationFrame(() => installPublicExtensions(data.settings));
    }
    if (data?.settings?.settings?.siteTitle) {
      document.title = data.settings.settings.siteTitle;
    }
    if (data?.settings?.settings?.favicon) {
      const existing = document.querySelector('link[rel="icon"]');
      if (existing) {
        existing.setAttribute("href", data.settings.settings.favicon);
      } else {
        const icon = document.createElement("link");
        icon.rel = "icon";
        icon.href = data.settings.settings.favicon;
        document.head.appendChild(icon);
      }
    }
  }, [data]);

  return <>{children}</>;
}
