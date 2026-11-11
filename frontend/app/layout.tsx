import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";

export const metadata: Metadata = {
  title: "Safety Assistant",
  description: "Offline AI assistant for the safety management system",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script adds the "dark" class before React loads.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
