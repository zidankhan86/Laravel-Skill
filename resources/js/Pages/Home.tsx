import React from "react";
import { Head } from "@inertiajs/react";
import App from "@/Components/App";
import VisualEditor from "@/Components/VisualEditor";
import { setContent } from "@/lib/content";
import { hydrate } from "@/lib/constants";
import { initializePublicTheme } from "@/lib/public-theme";

interface HomeProps {
  content?: any[];
  settings?: any;
  isEditing?: boolean;
}

export default function Home({ content, settings, isEditing }: HomeProps) {
  const safeContent = content || [];
  if (settings) {
    hydrate({ settings, content: safeContent });
    setContent({ settings, content: safeContent });
    if (settings.appearance && typeof window !== "undefined") {
      initializePublicTheme(settings.appearance);
    }
  }

  const siteTitle =
    settings?.settings?.siteTitle ||
    "Md Tanvir Hossain | eCommerce Architect & Automation Specialist";
  const siteDescription =
    settings?.settings?.siteDescription ||
    settings?.brand?.bio ||
    "High-end personal brand portfolio for Md Tanvir Hossain, eCommerce Website Architect & Automation Specialist.";

  return (
    <>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
      </Head>
      {isEditing ? <VisualEditor /> : <App initialView="home" />}
    </>
  );
}
