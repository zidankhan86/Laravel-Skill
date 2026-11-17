import { Metadata } from "next";
import { fetchSiteData } from "@/lib/api-client";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import SiteInitializer from "@/components/SiteInitializer";
import App from "@/components/App";

export const metadata: Metadata = {
  title: "Book a Strategy Consultation | Md Tanvir Hossain",
  description:
    "Schedule a one-on-one architecture and automation consultation session with Md Tanvir Hossain.",
};

export default async function BookingPageRoute() {
  const data = await fetchSiteData();
  hydrate(data);
  setContent(data);

  return (
    <SiteInitializer data={data}>
      <App initialView="booking" />
    </SiteInitializer>
  );
}
