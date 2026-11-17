import { Metadata } from "next";
import { fetchSiteData } from "@/lib/api-client";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import SiteInitializer from "@/components/SiteInitializer";
import App from "@/components/App";

export const metadata: Metadata = {
  title: "Services | Md Tanvir Hossain",
  description:
    "Comprehensive eCommerce solutions, custom Shopify & WooCommerce architectures, performance optimization, and automation workflows.",
};

export default async function ServicesPageRoute() {
  const data = await fetchSiteData();
  hydrate(data);
  setContent(data);

  return (
    <SiteInitializer data={data}>
      <App initialView="services" />
    </SiteInitializer>
  );
}
