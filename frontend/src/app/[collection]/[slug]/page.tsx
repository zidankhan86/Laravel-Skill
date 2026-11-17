import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchSiteData } from "@/lib/api-client";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import SiteInitializer from "@/components/SiteInitializer";
import DetailPage from "@/components/DetailPage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

interface DetailPageRouteProps {
  params: Promise<{
    collection: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: DetailPageRouteProps): Promise<Metadata> {
  const { collection, slug } = await params;
  try {
    const data = await fetchSiteData();
    const record = data.content?.find(
      (r: any) => r.collection === collection && r.slug === slug,
    );

    if (!record) {
      return {
        title: "Not Found | Md Tanvir Hossain",
      };
    }

    const title = `${record.title} | ${data.settings?.brand?.name || "Md Tanvir Hossain"}`;
    const description = record.summary || "";
    const image = record.fields?.image || record.fields?.thumbnail;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image }] : undefined,
      },
    };
  } catch {
    return {
      title: "Detail | Md Tanvir Hossain",
    };
  }
}

export default async function DetailPageRoute({
  params,
}: DetailPageRouteProps) {
  const { collection, slug } = await params;
  const data = await fetchSiteData();
  hydrate(data);
  setContent(data);

  const record = data.content?.find(
    (r: any) => r.collection === collection && r.slug === slug,
  );

  if (!record) {
    notFound();
  }

  return (
    <SiteInitializer data={data}>
      <main
        id="main-content"
        tabIndex={-1}
        className="portfolio selection:bg-red-500/30 selection:text-white min-h-screen relative"
      >
        <a className="skip-link" href="#page-content">
          Skip to content
        </a>
        <Navbar currentView={collection} />
        <div id="page-content" tabIndex={-1} className="pt-24 pb-16">
          <DetailPage record={record} listing={false} />
        </div>
        <Footer />
        <FloatingActions />
      </main>
    </SiteInitializer>
  );
}
