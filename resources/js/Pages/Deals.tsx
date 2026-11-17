import React from "react";
import { Head } from "@inertiajs/react";
import App from "@/Components/App";

export default function Deals({ settings }: { settings?: any }) {
  const siteTitle = settings?.settings?.siteTitle || "Md Tanvir Hossain";

  return (
    <>
      <Head>
        <title>{`Exclusive Deals & Discounts | ${siteTitle}`}</title>
        <meta
          name="description"
          content="Curated discounts and exclusive hosting deals for eCommerce entrepreneurs."
        />
      </Head>
      <App initialView="deals" />
    </>
  );
}
