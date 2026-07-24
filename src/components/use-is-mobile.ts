"use client";
import { useSyncExternalStore } from "react";

/**
 * CopilotKit's drawer breakpoint.
 * Source: copilotkit-threads-drawer.mjs:10
 */
export const MOBILE_BREAKPOINT = 768;

const QUERY = `(max-width: ${MOBILE_BREAKPOINT}px)`;

function getSnapshot(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void): () => void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => {};
  }
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => {
    mql.removeEventListener("change", callback);
  };
}

/**
 * `true` when `matchMedia("(max-width: 768px)")` matches.
 * `useSyncExternalStore` with `getServerSnapshot === () => false`, so SSR and the
 * hydration render always assume desktop. Returns `false` when `matchMedia` is absent.
 * Used ONLY for ARIA roles — all visual responsiveness is CSS.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
