import { Metadata } from "next";
import { fetchSiteData } from "@/lib/api-client";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import SiteInitializer from "@/components/SiteInitializer";
import App from "@/components/App";

export const metadata: Metadata = {
  title: "Contact | Md Tanvir Hossain",
  description:
    "Get in touch with Md Tanvir Hossain for new projects, eCommerce audits, consulting, and inquiries.",
};

export default async function ContactPageRoute() {
  const data = await fetchSiteData();
  hydrate(data);
  setContent(data);

  return (
    <SiteInitializer data={data}>
      <App initialView="contact" />
    </SiteInitializer>
  );
}
