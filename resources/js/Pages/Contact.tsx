import React from "react";
import { Head } from "@inertiajs/react";
import App from "@/Components/App";

export default function Contact({ settings }: { settings?: any }) {
  const siteTitle = settings?.settings?.siteTitle || "Md Tanvir Hossain";

  return (
    <>
      <Head>
        <title>{`Get in Touch | ${siteTitle}`}</title>
        <meta
          name="description"
          content="Have a project in mind? Reach out to discuss custom development, funnels, or integrations."
        />
      </Head>
      <App initialView="contact" />
    </>
  );
}
