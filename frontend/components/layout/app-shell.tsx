"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, PanelLeftClose, PanelLeftOpen, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Placeholder logo area: replace with the organisation logo (put the file in /public). */}
      <div
        className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
        aria-hidden="true"
      >
        <ShieldCheck className="size-5" />
      </div>
      <span className="text-base font-semibold tracking-tight">
        Safety Assistant
      </span>
    </div>
  );
}

/** Navigation. Used by desktop sidebar and mobile drawer. */
function SidebarBody({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} collapsed={collapsed} />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop icon-only sidebar

  return (
    <div className="flex h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-3 md:px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <Brand />
        </div>
        <ThemeToggle />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`hidden shrink-0 border-r border-border bg-surface transition-[width] duration-200 md:flex md:flex-col ${collapsed ? "w-14" : "w-56"}`}
        >
          <SidebarBody collapsed={collapsed} />
        </aside>

        {/* Mobile navigation drawer */}
        <DialogPrimitive.Root open={navOpen} onOpenChange={setNavOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 md:hidden" />
            <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface shadow-xl md:hidden">
              <DialogPrimitive.Title className="sr-only">
                Navigation
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Main site navigation
              </DialogPrimitive.Description>
              <div className="flex h-14 items-center justify-between border-b border-border px-3">
                <Brand />
                <DialogPrimitive.Close asChild>
                  <Button variant="ghost" size="icon" aria-label="Close menu">
                    <X />
                  </Button>
                </DialogPrimitive.Close>
              </div>
              <SidebarBody onNavigate={() => setNavOpen(false)} />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>

        <main id="main" className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
