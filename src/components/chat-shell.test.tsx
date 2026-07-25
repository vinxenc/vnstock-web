import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { ChatShell } from "./chat-shell";

// CopilotProvider is a passthrough here; we assert layout, not provider wiring.
vi.mock("./copilot-provider", () => ({
  CopilotProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="copilot-provider">{children}</div>
  ),
}));

// Expose the drawer's collapse callback via a button we can click.
vi.mock("./threads-drawer", () => ({
  ThreadsDrawer: ({
    isCollapsed,
    onCollapsedChange,
  }: {
    isCollapsed?: boolean;
    onCollapsedChange?: (c: boolean) => void;
  }) => (
    <div data-testid="threads-drawer" data-collapsed={String(isCollapsed)}>
      <button
        type="button"
        data-testid="drawer-collapse"
        onClick={() => onCollapsedChange?.(true)}
      >
        collapse
      </button>
      <button
        type="button"
        data-testid="drawer-expand"
        onClick={() => onCollapsedChange?.(false)}
      >
        expand
      </button>
    </div>
  ),
}));

// A child that counts mounts, so a stray remount would be observable.
let mountCount = 0;
function MountProbe(): React.JSX.Element {
  useEffect(() => {
    mountCount += 1;
  }, []);
  return <div data-testid="probe" />;
}

describe("ChatShell (v2)", () => {
  it("wraps content in CopilotProvider and renders children in <main>", () => {
    render(
      <ChatShell>
        <span data-testid="child">hi</span>
      </ChatShell>,
    );
    expect(screen.getByTestId("copilot-provider")).toBeInTheDocument();
    const main = document.querySelector("main");
    expect(main).not.toBeNull();
    expect(main).toContainElement(screen.getByTestId("child"));
  });

  it("reserves the 320px drawer track when expanded, and removes it when collapsed", () => {
    render(<ChatShell>x</ChatShell>);
    const shell = screen.getByTestId("chat-shell");
    // Expanded: two-column grid, main offset into column 2.
    expect(shell).toHaveAttribute("data-collapsed", "false");
    expect(shell.className).toContain(
      "md:grid-cols-[var(--cpk-drawer-reserved-width,320px)_minmax(0,1fr)]",
    );
    expect(document.querySelector("main")?.className).toContain(
      "md:col-start-2",
    );

    // Collapse via the drawer callback.
    fireEvent.click(screen.getByTestId("drawer-collapse"));
    expect(shell).toHaveAttribute("data-collapsed", "true");
    expect(shell.className).toContain("md:grid-cols-1");
    // Collapsed main pads for the floating launcher and drops the column offset.
    expect(document.querySelector("main")?.className).toContain("md:pt-16");
    expect(document.querySelector("main")?.className).not.toContain(
      "md:col-start-2",
    );
  });

  it("round-trips collapse -> expand", () => {
    render(<ChatShell>x</ChatShell>);
    const shell = screen.getByTestId("chat-shell");
    fireEvent.click(screen.getByTestId("drawer-collapse"));
    expect(shell).toHaveAttribute("data-collapsed", "true");
    fireEvent.click(screen.getByTestId("drawer-expand"));
    expect(shell).toHaveAttribute("data-collapsed", "false");
  });

  it("does not remount the chat subtree when toggling collapse (no key remount)", () => {
    mountCount = 0;
    render(
      <ChatShell>
        <MountProbe />
      </ChatShell>,
    );
    expect(mountCount).toBe(1);
    // A key={...} remount tied to shell state would re-run the mount effect.
    fireEvent.click(screen.getByTestId("drawer-collapse"));
    fireEvent.click(screen.getByTestId("drawer-expand"));
    expect(mountCount).toBe(1);
  });
});
