"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Theme = "light" | "dark". Stored in localStorage under "theme"; light is the
 * default. The first paint is handled by THEME_INIT_SCRIPT (lib/theme-script.ts);
 * this file keeps it in sync after that.
 */
type Theme = "light" | "dark";
const KEY = "theme";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    if (localStorage.getItem(KEY) === "dark") return "dark";
  } catch {
    /* storage unavailable */
  }
  return "light";
}

function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* theme just won't persist */
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Theme changed in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      document.documentElement.classList.toggle("dark", readTheme() === "dark");
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

/** Icon-only Light / Dark switch for the top-right of the header. */
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "light");

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex gap-0.5 rounded-lg bg-surface-muted p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            title={label}
            aria-label={label}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors",
              active
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
