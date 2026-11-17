import { designDefaults } from "./design-themes";
export const appearanceDefaults = {
  ...designDefaults,
  websiteGreenColor: "#103b2a",
  websiteLimeColor: "#d0f56a",
  websiteLavenderColor: "#d8cdf3",
  websitePrimaryColor: "#dc143c",
  adminPrimaryColor: "#d8ef89",
  websiteTheme: "dark",
  adminTheme: "light",
};
export function contrastText(hex: string) {
  const rgb = hex.match(/[a-f\d]{2}/gi)!.map((x) => {
    const v = parseInt(x, 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179
    ? "#102d2c"
    : "#ffffff";
}
export function applyAppearance(
  value: Record<string, string> = {},
  scope: "website" | "admin",
) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }
  const settings = { ...appearanceDefaults, ...value };
  const root = document.documentElement;
  const color = settings[`${scope}PrimaryColor`];
  if (/^#[a-f\d]{6}$/i.test(color)) {
    root.style.setProperty(`--${scope}-primary`, color);
    root.style.setProperty(`--${scope}-on-primary`, contrastText(color));
    root.style.setProperty(
      "--primary-rgb",
      color
        .match(/[a-f\d]{2}/gi)!
        .map((x) => parseInt(x, 16))
        .join(" "),
    );
  }
  if (scope === "website") {
    for (const key of Object.keys(designDefaults))
      root.dataset[key] = settings[key as keyof typeof settings];
    for (const [field, token] of [
      ["websiteGreenColor", "green"],
      ["websiteLimeColor", "lime"],
      ["websiteLavenderColor", "lavender"],
    ] as const) {
      const hex = settings[field];
      if (/^#[a-f\d]{6}$/i.test(hex)) {
        root.style.setProperty(`--website-${token}`, hex);
        root.style.setProperty(`--website-on-${token}`, contrastText(hex));
        root.style.setProperty(
          `--website-on-${token}-rgb`,
          contrastText(hex)
            .match(/[a-f\d]{2}/gi)!
            .map((x) => parseInt(x, 16))
            .join(" "),
        );
      }
    }
  }
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const update = () => {
    const mode = settings[`${scope}Theme`];
    const resolved =
      mode === "system" ? (media.matches ? "dark" : "light") : mode;
    root.dataset[`${scope}Theme`] = resolved;
    root.style.colorScheme = resolved;
  };
  update();
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}
