import React from "react";
import { Head } from "@inertiajs/react";
import Admin from "@/Components/Admin";

export default function AdminPage() {
  return (
    <>
      <Head>
        <title>Admin Workspace | Portfolio CMS</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Admin />
    </>
  );
}
