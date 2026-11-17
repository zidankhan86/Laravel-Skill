import { Metadata } from "next";
import { fetchSiteData } from "@/lib/api-client";
import { hydrate } from "@/lib/constants";
import { setContent } from "@/lib/content";
import SiteInitializer from "@/components/SiteInitializer";
import EditorOrApp from "@/components/EditorOrApp";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = await fetchSiteData();
    const siteTitle =
      data?.settings?.settings?.siteTitle ||
      "Md Tanvir Hossain | eCommerce Architect & Automation Specialist";
    const siteDescription =
      data?.settings?.settings?.siteDescription ||
      data?.settings?.brand?.bio ||
      "High-end personal brand portfolio for Md Tanvir Hossain, eCommerce Website Architect & Automation Specialist.";
    const favicon = data?.settings?.settings?.favicon;

    return {
      title: siteTitle,
      description: siteDescription,
      icons: favicon ? { icon: favicon } : undefined,
    };
  } catch {
    return {
      title: "Md Tanvir Hossain | eCommerce Architect & Automation Specialist",
    };
  }
}

export default async function HomePage() {
  try {
    const data = await fetchSiteData();
    hydrate(data);
    setContent(data);

    return (
      <SiteInitializer data={data}>
        <EditorOrApp />
      </SiteInitializer>
    );
  } catch (error) {
    return (
      <main className="min-h-screen bg-black text-white grid place-items-center">
        <div role="alert" className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">
            Website temporarily unavailable
          </h1>
          <p className="text-neutral-400 mb-6">Please try again shortly.</p>
          <a
            href="/"
            className="px-6 py-2 bg-red-600 rounded-lg text-white font-medium inline-block hover:bg-red-700 transition-colors"
          >
            Retry
          </a>
        </div>
      </main>
    );
  }
}
