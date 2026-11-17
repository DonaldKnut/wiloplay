"use client";

import { useEffect } from "react";

export type WiloplayTheme = "dark" | "light";

export function resolveTheme(stored: string | null, prefersLight: boolean): WiloplayTheme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersLight ? "light" : "dark";
}

export function applyTheme(theme: WiloplayTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeInitializer() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const syncTheme = () => {
      const theme = resolveTheme(localStorage.getItem("wiloplay-theme"), media.matches);
      applyTheme(theme);
    };

    syncTheme();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "wiloplay-theme") syncTheme();
    };
    media.addEventListener("change", syncTheme);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
