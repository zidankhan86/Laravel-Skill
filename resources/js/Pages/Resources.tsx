import React from "react";
import { Head } from "@inertiajs/react";
import App from "@/Components/App";

export default function Resources({ settings }: { settings?: any }) {
  const siteTitle = settings?.settings?.siteTitle || "Md Tanvir Hossain";

  return (
    <>
      <Head>
        <title>{`Free Resources & Blueprints | ${siteTitle}`}</title>
        <meta
          name="description"
          content="Download free eCommerce automation blueprints, spreadsheets, and marketing templates."
        />
      </Head>
      <App initialView="resources" />
    </>
  );
}
