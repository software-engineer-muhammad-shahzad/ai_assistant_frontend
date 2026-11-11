import type { Metadata } from "next";
import { StatusView } from "@/components/status/status-view";

export const metadata: Metadata = { title: "Status · Safety Assistant" };

export default function StatusPage() {
  return <StatusView />;
}
