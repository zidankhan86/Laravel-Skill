import React from "react";
import { Head } from "@inertiajs/react";
import App from "@/Components/App";

export default function Booking({ settings }: { settings?: any }) {
  const siteTitle = settings?.settings?.siteTitle || "Md Tanvir Hossain";

  return (
    <>
      <Head>
        <title>{`Book a 1-on-1 Consultation | ${siteTitle}`}</title>
        <meta
          name="description"
          content="Schedule a strategic consultation to optimize and automate your eCommerce business."
        />
      </Head>
      <App initialView="booking" />
    </>
  );
}
