const targets: Record<string, string> = {
  hero: "hero",
  trust: "trust",
  about: "about",
  aboutme: "journey",
  journey: "journey",
  services: "services",
  youtube: "videos",
  videos: "videos",
  projects: "projects",
  deals: "deals",
  resources: "resources",
  gallery: "gallery",
  testimonials: "testimonials",
  reviews: "testimonials",
  booking: "booking",
  contact: "booking",
  blog: "blog",
};
export function filterSectionMenu(
  menu: string,
  enabled: string[],
  content: any[],
  canonicalDomain?: string,
) {
  const available = new Set(enabled);
  for (const key of [
    "services",
    "projects",
    "deals",
    "resources",
    "testimonials",
    "videos",
  ])
    if (!content.some((r) => r.collection === key && r.featured))
      available.delete(key);
  if (!content.some((r) => r.collection === "gallery" && r.fields.image))
    available.delete("gallery");
  return menu
    .split("\n")
    .filter(Boolean)
    .filter((line) => {
      const url = line.split("|")[1] || "";
      let target = url;
      try {
        const parsed = new URL(url, location.origin);
        const canonicalOrigin = canonicalDomain
          ? new URL(canonicalDomain).origin
          : location.origin;
        if (
          parsed.origin !== location.origin &&
          parsed.origin !== canonicalOrigin
        )
          return true;
        target = parsed.hash
          ? parsed.hash.slice(1)
          : parsed.pathname.replace(/^\/|\/$/g, "");
      } catch {
        return true;
      }
      const section = targets[target];
      return !section || available.has(section);
    })
    .join("\n");
}
