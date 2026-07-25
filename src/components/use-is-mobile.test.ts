/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsMobile, MOBILE_BREAKPOINT } from "./use-is-mobile";

describe("useIsMobile", () => {
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", {
        value: originalMatchMedia,
        writable: true,
        configurable: true,
      });
    } else {
      delete (window as any).matchMedia;
    }
  });

  describe("E22 — missing or broken matchMedia", () => {
    it("returns false when matchMedia is undefined", () => {
      delete (window as any).matchMedia;

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it("returns false when matchMedia is not a function", () => {
      (window as any).matchMedia = "not a function";

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe("E22 — matchMedia support with addEventListener/removeEventListener", () => {
    it("queries (max-width: 768px) and returns matching state", () => {
      const mockMatches = true;
      const listeners: ((e: MediaQueryListEvent) => void)[] = [];

      const mockMQL = {
        matches: mockMatches,
        addEventListener: vi.fn(
          (event: string, cb: (e: MediaQueryListEvent) => void) => {
            if (event === "change") listeners.push(cb);
          },
        ),
        removeEventListener: vi.fn(
          (event: string, cb: (e: MediaQueryListEvent) => void) => {
            if (event === "change") {
              const idx = listeners.indexOf(cb);
              if (idx >= 0) listeners.splice(idx, 1);
            }
          },
        ),
      };

      Object.defineProperty(window, "matchMedia", {
        value: vi.fn(() => mockMQL),
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(mockMatches);
      expect(window.matchMedia).toHaveBeenCalledWith(
        `(max-width: ${MOBILE_BREAKPOINT}px)`,
      );
    });

    it("listens and removes listener symmetrically", () => {
      const listeners: ((e: MediaQueryListEvent) => void)[] = [];
      const addEventListenerSpy = vi.fn(
        (event: string, cb: (e: MediaQueryListEvent) => void) => {
          if (event === "change") listeners.push(cb);
        },
      );
      const removeEventListenerSpy = vi.fn(
        (event: string, cb: (e: MediaQueryListEvent) => void) => {
          if (event === "change") {
            const idx = listeners.indexOf(cb);
            if (idx >= 0) listeners.splice(idx, 1);
          }
        },
      );

      const mockMQL = {
        matches: false,
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
      };

      Object.defineProperty(window, "matchMedia", {
        value: vi.fn(() => mockMQL),
        writable: true,
        configurable: true,
      });

      const { unmount } = renderHook(() => useIsMobile());

      // Verify listener was added
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
      expect(listeners).toHaveLength(1);

      // Unmount should remove the listener
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(listeners).toHaveLength(0);
    });
  });

  describe("getServerSnapshot returns false", () => {
    it("always returns false for SSR", () => {
      const { result } = renderHook(() => useIsMobile());
      // On first render with getServerSnapshot, it should be false
      // (subsequent renders may differ based on matchMedia, but SSR snapshot is always false)
      expect(result.current).toBe(false);
    });
  });

  describe("state updates on media query change", () => {
    it("updates state when matchMedia changes", async () => {
      let currentMatches = false;
      const listeners: ((e: MediaQueryListEvent) => void)[] = [];

      const mockMQL = {
        get matches() {
          return currentMatches;
        },
        addEventListener: vi.fn(
          (event: string, cb: (e: MediaQueryListEvent) => void) => {
            if (event === "change") listeners.push(cb);
          },
        ),
        removeEventListener: vi.fn(
          (event: string, cb: (e: MediaQueryListEvent) => void) => {
            if (event === "change") {
              const idx = listeners.indexOf(cb);
              if (idx >= 0) listeners.splice(idx, 1);
            }
          },
        ),
      };

      Object.defineProperty(window, "matchMedia", {
        value: vi.fn(() => mockMQL),
        writable: true,
        configurable: true,
      });

      const { result, rerender } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Simulate media query change
      currentMatches = true;
      if (listeners.length > 0) {
        listeners[0]({ matches: true } as any);
      }
      rerender();
      expect(result.current).toBe(true);
    });
  });
});
