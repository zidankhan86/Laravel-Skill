import { Metadata } from "next";
import { fetchSiteData } from "@/lib/api-client";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import SiteInitializer from "@/components/SiteInitializer";
import App from "@/components/App";

export const metadata: Metadata = {
  title: "Projects | Md Tanvir Hossain",
  description:
    "Featured eCommerce projects, enterprise web systems, and custom automation platforms built by Md Tanvir Hossain.",
};

export default async function ProjectsPageRoute() {
  const data = await fetchSiteData();
  hydrate(data);
  setContent(data);

  return (
    <SiteInitializer data={data}>
      <App initialView="projects" />
    </SiteInitializer>
  );
}
