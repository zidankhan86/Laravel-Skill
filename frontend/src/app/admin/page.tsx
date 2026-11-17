import { Metadata } from "next";
import Admin from "@/components/Admin";

export const metadata: Metadata = {
  title: "Admin Workspace | Portfolio CMS",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <Admin />;
}
