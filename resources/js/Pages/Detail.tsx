import React from "react";
import { Head } from "@inertiajs/react";
import Navbar from "@/Components/Navbar";
import DetailPage from "@/Components/DetailPage";
import Footer from "@/Components/Footer";
import FloatingActions from "@/Components/FloatingActions";

interface DetailProps {
  record: any;
  collection: string;
  slug: string;
  settings?: any;
}

export default function Detail({ record, collection, slug, settings }: DetailProps) {
  const pageTitle =
    record?.seo_title ||
    record?.title ||
    (collection === "blog" ? "Blog" : "Portfolio Item");
  const pageDescription =
    record?.seo_description ||
    record?.summary ||
    settings?.settings?.siteDescription ||
    "";

  return (
    <>
      <Head>
        <title>{`${pageTitle} | ${settings?.settings?.siteTitle || "Md Tanvir Hossain"}`}</title>
        <meta name="description" content={pageDescription} />
      </Head>
      <main
        id="main-content"
        className="portfolio selection:bg-red-500/30 selection:text-white min-h-screen relative"
      >
        <Navbar currentView={collection} />
        <div id="page-content">
          <DetailPage record={record} listing={collection === "blog" && !slug} />
        </div>
        <Footer />
        <FloatingActions />
      </main>
    </>
  );
}
