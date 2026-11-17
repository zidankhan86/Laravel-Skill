import React from "react";
import { Head } from "@inertiajs/react";
import App from "@/Components/App";

export default function Blog({ settings }: { settings?: any }) {
  const siteTitle = settings?.settings?.siteTitle || "Md Tanvir Hossain";

  return (
    <>
      <Head>
        <title>{`Articles & Insights | ${siteTitle}`}</title>
        <meta
          name="description"
          content="Latest eCommerce insights, case studies, and engineering tutorials."
        />
      </Head>
      <App initialView="blog" />
    </>
  );
}
