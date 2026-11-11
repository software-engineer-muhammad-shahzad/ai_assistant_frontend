"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  FolderUp,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Chat", icon: MessageSquare },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/uploads", label: "My Uploads", icon: FolderUp },
  { href: "/status", label: "Status", icon: Activity },
];

export function NavLinks({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={cn("flex flex-col gap-1", collapsed ? "items-center p-2" : "p-3")}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? label : undefined}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center rounded-md text-sm font-medium transition-colors",
              collapsed ? "size-10 justify-center" : "gap-3 px-3 py-2",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {!collapsed && label}
          </Link>
        );
      })}
    </nav>
  );
}
