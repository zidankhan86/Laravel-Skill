import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Md Tanvir Hossain | eCommerce Architect & Automation Specialist",
  description:
    "High-end personal brand portfolio for Md Tanvir Hossain, eCommerce Website Architect & Automation Specialist.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="scroll-smooth"
      data-website-theme="dark"
      data-website-design="editorial"
      data-website-density="comfortable"
      data-website-corners="rounded"
      data-website-motion="subtle"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Hind+Siliguri:wght@400;500;600&family=Montserrat:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
