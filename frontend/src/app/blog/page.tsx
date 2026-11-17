import { Metadata } from "next";
import { fetchSiteData } from "@/lib/api-client";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import SiteInitializer from "@/components/SiteInitializer";
import App from "@/components/App";

export const metadata: Metadata = {
  title: "Blog & Insights | Md Tanvir Hossain",
  description:
    "Articles, thoughts, and technical insights on eCommerce development, conversion rate optimization, and automation.",
};

export default async function BlogPageRoute() {
  const data = await fetchSiteData();
  hydrate(data);
  setContent(data);

  return (
    <SiteInitializer data={data}>
      <App initialView="blog" />
    </SiteInitializer>
  );
}
