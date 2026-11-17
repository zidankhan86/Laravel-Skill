// Broaden only the public document policy for explicitly enabled owner extensions.
// Admin, JSON APIs, editor and preview documents keep the default strict policy.
export function extensionCsp(current, settings) {
  const i = settings.integrations || {},
    custom = settings.customCode?.enabled === "on";
  const parts = new Map(
    current
      .split(";")
      .filter(Boolean)
      .map((p) => {
        const [k, ...v] = p.trim().split(/\s+/);
        return [k, v];
      }),
  );
  const add = (key, ...values) =>
    parts.set(key, [
      ...new Set([...(parts.get(key) || ["'self'"]), ...values]),
    ]);
  if (i.facebookEnabled === "on") {
    add("script-src", "https://connect.facebook.net");
    add(
      "connect-src",
      "https://www.facebook.com",
      "https://connect.facebook.net",
    );
  }
  if (i.tiktokEnabled === "on") {
    add("script-src", "https://analytics.tiktok.com");
    add(
      "connect-src",
      "https://analytics.tiktok.com",
      "https://*.tiktok.com",
      "https://*.tiktokv.com",
    );
  }
  if (i.gtmEnabled === "on") {
    add("script-src", "https:");
    add("connect-src", "https:");
    add("frame-src", "https:");
  }
  if (custom) {
    add("script-src", "'unsafe-inline'", "https:");
    add("connect-src", "https:", "wss:");
    add("style-src", "https:");
    add("font-src", "https:", "data:");
    add("frame-src", "https:");
  }
  return [...parts].map(([k, v]) => k + " " + v.join(" ")).join("; ");
}
