import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("frontend/src/components");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx"));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, "utf-8");

  // Add "use client" if not present
  if (!content.trim().startsWith('"use client"') && !content.trim().startsWith("'use client'")) {
    content = `"use client";\n\n` + content;
  }

  // Replace imports
  content = content
    .replace(/from\s+["']\.\.\/content["']/g, 'from "@/lib/content"')
    .replace(/from\s+["']\.\.\/constants["']/g, 'from "@/lib/constants"')
    .replace(/from\s+["']\.\.\/theme["']/g, 'from "@/lib/theme"')
    .replace(/from\s+["']\.\.\/public-theme["']/g, 'from "@/lib/public-theme"')
    .replace(/from\s+["']\.\.\/public-integrations["']/g, 'from "@/lib/public-integrations"')
    .replace(/from\s+["']\.\.\/editor-api["']/g, 'from "@/lib/editor-api"')
    .replace(/from\s+["']\.\.\/design-themes["']/g, 'from "@/lib/design-themes"')
    .replace(/from\s+["']\.\.\/visibility["']/g, 'from "@/lib/visibility"')
    .replace(/from\s+["']\.\.\/server\/settings-definition\.json["']/g, 'from "@/lib/settings-definition.json"')
    .replace(/from\s+["']\.\.\/homepage-sections\.json["']/g, 'from "@/lib/homepage-sections.json"')
    .replace(/from\s+["']\.\.\/section-order\.mjs["']/g, 'from "@/lib/section-order.mjs"')
    .replace(/from\s+["']\.\.\/types["']/g, 'from "@/lib/types"')
    .replace(/from\s+["']\.\.\/App["']/g, 'from "./App"');

  // SSR guard in Navbar
  if (file === "Navbar.tsx") {
    content = content.replace(
      'document.documentElement.dataset.websiteTheme === "dark"',
      'typeof document !== "undefined" && document.documentElement.dataset.websiteTheme === "dark"'
    );
  }

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Updated ${file}`);
}
