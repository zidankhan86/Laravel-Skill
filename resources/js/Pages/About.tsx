import React from "react";
import { Head } from "@inertiajs/react";
import App from "@/Components/App";

export default function About({ settings }: { settings?: any }) {
  const siteTitle = settings?.settings?.siteTitle || "Md Tanvir Hossain";

  return (
    <>
      <Head>
        <title>{`About Me | ${siteTitle}`}</title>
        <meta
          name="description"
          content="Learn more about Md Tanvir Hossain, eCommerce Website Architect & Automation Specialist."
        />
      </Head>
      <App initialView="about" />
    </>
  );
}
