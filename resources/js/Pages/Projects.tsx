import React from "react";
import { Head } from "@inertiajs/react";
import App from "@/Components/App";

export default function Projects({ settings }: { settings?: any }) {
  const siteTitle = settings?.settings?.siteTitle || "Md Tanvir Hossain";

  return (
    <>
      <Head>
        <title>{`Featured Projects & Case Studies | ${siteTitle}`}</title>
        <meta
          name="description"
          content="Explore recent ecommerce case studies, custom web applications, and sales funnels."
        />
      </Head>
      <App initialView="projects" />
    </>
  );
}
