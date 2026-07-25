/**
 * Dark-mode strategy for CopilotKit v2.
 *
 * v2 scopes its design tokens to `[data-copilotkit]` and keys dark mode off a
 * `.dark` ANCESTOR class:
 *   [data-copilotkit]{--background:oklch(100% 0 0); …}
 *   .dark [data-copilotkit],[data-copilotkit].dark{--background:oklch(14.5% 0 0); …}
 * (@copilotkit/react-core/dist/v2/index.css). There is no `prefers-color-scheme`
 * rule anywhere in that file, and several utilities hardcode colours under
 * `:is(.dark *)`, so overriding tokens alone is NOT sufficient.
 *
 * No React and no browser globals are touched at import time.
 */

export const DARK_CLASS = "dark";
export const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/** Add or remove the dark class. Idempotent. */
export function applyColorScheme(root: Element, prefersDark: boolean): void {
  root.classList.toggle(DARK_CLASS, prefersDark);
}

/** `true` when the OS prefers dark. `false` when `matchMedia` is unavailable. */
export function prefersDarkColorScheme(
  win: Window | undefined = globalThis.window,
): boolean {
  if (!win || typeof win.matchMedia !== "function") return false;
  return win.matchMedia(COLOR_SCHEME_QUERY).matches;
}

/**
 * Subscribe to OS colour-scheme changes. Returns an unsubscribe function.
 * A no-op unsubscribe is returned when `matchMedia` is unavailable.
 */
export function subscribeToColorScheme(
  onChange: (prefersDark: boolean) => void,
  win: Window | undefined = globalThis.window,
): () => void {
  if (!win || typeof win.matchMedia !== "function") return () => {};
  const mql = win.matchMedia(COLOR_SCHEME_QUERY);
  const listener = (event: MediaQueryListEvent) => {
    onChange(event.matches);
  };
  mql.addEventListener("change", listener);
  return () => {
    mql.removeEventListener("change", listener);
  };
}

/**
 * Source of the blocking inline script rendered in <head>. It runs before first
 * paint so a dark-OS user never sees a light flash, and it converges with
 * `<ColorSchemeSync>` (both call `classList.toggle`, which is idempotent).
 * Kept as a string so it can be evaluated verbatim in tests.
 */
export const COLOR_SCHEME_BOOTSTRAP_SCRIPT = `(function(){try{var d=window.matchMedia&&window.matchMedia(${JSON.stringify(
  COLOR_SCHEME_QUERY,
)}).matches;document.documentElement.classList.toggle(${JSON.stringify(
  DARK_CLASS,
)},!!d)}catch(e){}})()`;
