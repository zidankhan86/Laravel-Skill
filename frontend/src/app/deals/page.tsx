import { Metadata } from "next";
import { fetchSiteData } from "@/lib/api-client";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import SiteInitializer from "@/components/SiteInitializer";
import App from "@/components/App";

export const metadata: Metadata = {
  title: "Exclusive Deals & Offers | Md Tanvir Hossain",
  description:
    "Special discounts, hosting perks, and curated developer deals for clients and partners.",
};

export default async function DealsPageRoute() {
  const data = await fetchSiteData();
  hydrate(data);
  setContent(data);

  return (
    <SiteInitializer data={data}>
      <App initialView="deals" />
    </SiteInitializer>
  );
}
