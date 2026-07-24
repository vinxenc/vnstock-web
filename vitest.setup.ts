// Registers the jest-dom matchers (toBeInTheDocument, etc.) and their types.
// React Testing Library's automatic cleanup is provided separately by
// @testing-library/react itself, which registers it when a global afterEach
// is available (Vitest's `globals: true`).
import "@testing-library/jest-dom/vitest";

// Polyfill localStorage for jsdom if not available
if (typeof globalThis !== "undefined" && !globalThis.localStorage) {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    key: () => null,
    length: Object.keys(store).length,
  } as unknown as Storage;
}
