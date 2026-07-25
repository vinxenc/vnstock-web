"use client";
import { useEffect } from "react";
import {
  applyColorScheme,
  prefersDarkColorScheme,
  subscribeToColorScheme,
} from "@/lib/color-scheme";

/**
 * Keeps `<html class="dark">` in sync with the OS colour scheme after
 * hydration. The first paint is handled by COLOR_SCHEME_BOOTSTRAP_SCRIPT in
 * layout.tsx; this component only handles later changes. Renders nothing.
 */
export function ColorSchemeSync(): null {
  useEffect(() => {
    const root = document.documentElement;
    applyColorScheme(root, prefersDarkColorScheme());
    return subscribeToColorScheme((prefersDark) => {
      applyColorScheme(root, prefersDark);
    });
  }, []);
  return null;
}
