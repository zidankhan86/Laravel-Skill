import { applyAppearance } from "./theme";
let settings: Record<string, string> = {};
let cleanup: (() => void) | undefined;
export function setPublicMode(mode: string, remember = true) {
  if (typeof window === "undefined") return;
  cleanup?.();
  cleanup = applyAppearance({ ...settings, websiteTheme: mode }, "website");
  if (remember)
    try {
      localStorage.setItem("portfolio-visitor-mode", mode);
    } catch {}
  window.dispatchEvent(new Event("portfolio-theme"));
}
export function initializePublicTheme(value: Record<string, string>) {
  if (typeof window === "undefined") return;
  settings = value || {};
  let mode = settings.websiteTheme || "light";
  try {
    const saved = localStorage.getItem("portfolio-visitor-mode");
    if (saved && ["light", "dark", "system"].includes(saved)) mode = saved;
  } catch {}
  const preview = new URLSearchParams(location.search).get("theme");
  if (preview === "light" || preview === "dark") mode = preview;
  setPublicMode(mode, false);
}

// Same-origin, parent-only messages update this isolated preview, never stored settings.
if (
  typeof window !== "undefined" &&
  new URLSearchParams(location.search).get("preview") === "design" &&
  window.parent !== window
) {
  window.addEventListener("message", (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== window.parent ||
      event.data?.type !== "portfolio-design-preview"
    )
      return;
    const appearance = event.data.appearance;
    if (
      !appearance ||
      typeof appearance !== "object" ||
      Object.values(appearance).some((v) => typeof v !== "string")
    )
      return;
    cleanup?.();
    settings = appearance;
    cleanup = applyAppearance(appearance, "website");
  });
  document.addEventListener(
    "click",
    (event) => {
      const a = (event.target as HTMLElement).closest("a");
      if (a) {
        event.preventDefault();
        const url = new URL(a.href);
        if (url.origin === location.origin && url.hash)
          document.getElementById(url.hash.slice(1))?.scrollIntoView();
      }
    },
    true,
  );
  document.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
}
