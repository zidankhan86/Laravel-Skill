import React from "react";
import { Head } from "@inertiajs/react";
import App from "@/Components/App";

export default function Services({ settings }: { settings?: any }) {
  const siteTitle = settings?.settings?.siteTitle || "Md Tanvir Hossain";

  return (
    <>
      <Head>
        <title>{`Services & Solutions | ${siteTitle}`}</title>
        <meta
          name="description"
          content="High-converting eCommerce website development, custom Laravel funnels, and marketing automation."
        />
      </Head>
      <App initialView="services" />
    </>
  );
}
