import { filterSectionMenu } from "./visibility";
import React from "react";
import {
  ShoppingBag,
  Zap,
  Brain,
  Code,
  BarChart3,
  PlayCircle,
  Target,
  Eye,
  ShieldCheck,
  MessageSquare,
  Globe,
  Settings,
  Layers,
  Tag as TagIcon,
  ExternalLink,
  BookOpen,
  Download,
  FileText,
} from "lucide-react";
import {
  Service,
  Project,
  Review,
  VideoContent,
  Deal,
  Resource,
} from "./types";

export let BRAND_INFO: any = {};
export let SERVICES: any[] = [],
  PROJECTS: any[] = [],
  VIDEOS: any[] = [],
  DEALS: any[] = [],
  RESOURCES: any[] = [],
  REVIEWS: any[] = [];
export function hydrate(data: any) {
  const visible = data.settings.homepage.sections
    .split(",")
    .map((s: string) => s.trim());
  const target = (url: string) =>
    !visible.includes("booking") &&
    ["#booking", "/#booking", "#contact", "/#contact"].includes(url)
      ? url.endsWith("contact")
        ? "/contact"
        : "/booking"
      : url;
  data.settings.homepage.heroPrimaryTarget = target(
    data.settings.homepage.heroPrimaryTarget,
  );
  data.settings.homepage.heroSecondaryTarget = target(
    data.settings.homepage.heroSecondaryTarget,
  );
  data.settings.navigation.footerMenu = filterSectionMenu(
    data.settings.navigation.footerMenu,
    visible,
    data.content,
    data.settings.settings.canonicalDomain,
  );
  data.settings.navigation.menu = filterSectionMenu(
    data.settings.navigation.menu,
    visible,
    data.content,
    data.settings.settings.canonicalDomain,
  )
    .split("\n")
    .filter(Boolean)
    .map((line: string) => {
      const [label, url] = line.split("|");
      return label + "|" + target(url);
    })
    .join("\n");
  for (const record of data.content)
    if (record.collection === "services")
      record.fields.ctaUrl = target(record.fields.ctaUrl);
  const brand = data.settings.brand;
  BRAND_INFO = {
    ...brand,
    socials: Object.fromEntries(
      Object.entries(brand)
        .filter(([k]) => k.startsWith("social_"))
        .map(([k, v]) => [k.slice(7), v]),
    ),
  };
  const rows = (key: string) =>
    data.content
      .filter((r: any) => r.collection === key)
      .map((r: any) => ({
        ...r,
        ...r.fields,
        description: r.summary,
        quote: r.summary,
        thumbnail: r.fields.image,
        downloadUrl:
          r.fields.fileId && !r.fields.private
            ? "/media/" + r.fields.fileId
            : r.fields.downloadUrl,
      }));
  SERVICES = rows("services");
  PROJECTS = rows("projects");
  VIDEOS = rows("videos").filter((r) => r.featured);
  DEALS = rows("deals");
  RESOURCES = rows("resources");
  REVIEWS = rows("testimonials").filter((r) => r.featured);
}
export const ICON_MAP: Record<string, any> = {
  ShoppingBag,
  Zap,
  Brain,
  Code,
  BarChart3,
  PlayCircle,
  Target,
  Eye,
  ShieldCheck,
  MessageSquare,
  Globe,
  Settings,
  Layers,
  TagIcon,
  ExternalLink,
  BookOpen,
  Download,
  FileText,
};
