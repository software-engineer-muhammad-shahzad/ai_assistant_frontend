import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
  Table2,
} from "lucide-react";
import type { FileKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<FileKind, { Icon: typeof File; className: string; label: string }> = {
  pdf: { Icon: FileText, className: "text-danger", label: "PDF" },
  docx: { Icon: FileText, className: "text-info", label: "Word" },
  pptx: { Icon: Presentation, className: "text-warning", label: "PowerPoint" },
  xlsx: { Icon: FileSpreadsheet, className: "text-success", label: "Excel" },
  csv: { Icon: Table2, className: "text-success", label: "CSV" },
  txt: { Icon: FileText, className: "text-muted-foreground", label: "Text" },
  image: { Icon: FileImage, className: "text-primary", label: "Image" },
};

export const FILE_KIND_LABEL: Record<FileKind, string> = {
  pdf: "PDF",
  docx: "Word",
  pptx: "PowerPoint",
  xlsx: "Excel",
  csv: "CSV",
  txt: "Text",
  image: "Image",
};

export function FileIcon({
  kind,
  className,
}: {
  kind: FileKind;
  className?: string;
}) {
  const { Icon, className: color, label } = ICONS[kind];
  return (
    <Icon
      className={cn("size-5 shrink-0", color, className)}
      role="img"
      aria-label={label}
    />
  );
}
