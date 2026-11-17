import { Metadata } from "next";
import { fetchSiteData } from "@/lib/api-client";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import SiteInitializer from "@/components/SiteInitializer";
import App from "@/components/App";

export const metadata: Metadata = {
  title: "About | Md Tanvir Hossain",
  description:
    "Learn more about Md Tanvir Hossain, eCommerce Website Architect & Automation Specialist.",
};

export default async function AboutPageRoute() {
  const data = await fetchSiteData();
  hydrate(data);
  setContent(data);

  return (
    <SiteInitializer data={data}>
      <App initialView="about" />
    </SiteInitializer>
  );
}
