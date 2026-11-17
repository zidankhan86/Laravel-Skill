import { Metadata } from "next";
import { fetchSiteData } from "@/lib/api-client";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import SiteInitializer from "@/components/SiteInitializer";
import App from "@/components/App";

export const metadata: Metadata = {
  title: "Resources & Downloads | Md Tanvir Hossain",
  description:
    "Free guides, checklists, templates, and high-value architectural resources for growing brands.",
};

export default async function ResourcesPageRoute() {
  const data = await fetchSiteData();
  hydrate(data);
  setContent(data);

  return (
    <SiteInitializer data={data}>
      <App initialView="resources" />
    </SiteInitializer>
  );
}
