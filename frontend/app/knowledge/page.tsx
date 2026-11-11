import type { Metadata } from "next";
import { KnowledgeView } from "@/components/knowledge/knowledge-view";

export const metadata: Metadata = { title: "Knowledge Base · Safety Assistant" };

export default function KnowledgePage() {
  return <KnowledgeView />;
}
