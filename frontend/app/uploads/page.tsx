import type { Metadata } from "next";
import { UploadsView } from "@/components/uploads/uploads-view";

export const metadata: Metadata = { title: "My Uploads · Safety Assistant" };

export default function UploadsPage() {
  return <UploadsView />;
}
