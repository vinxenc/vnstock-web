import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThreadsDrawer } from "./threads-drawer";

// --- controllable v2 hook state -------------------------------------------
type ThreadsReturn = {
  threads: Array<{ id: string; title?: string }>;
  isLoading: boolean;
  listError: { message: string } | null;
  refetchThreads: ReturnType<typeof vi.fn>;
  startNewThread: ReturnType<typeof vi.fn>;
};
let threadsReturn: ThreadsReturn;
let configReturn: {
  agentId: string;
  threadId: string | null;
  setActiveThreadId: ReturnType<typeof vi.fn>;
  startNewThread: ReturnType<typeof vi.fn>;
} | null;
let agentReturn: { agent: { isRunning: boolean } | null };

vi.mock("@copilotkit/react-core/v2", () => ({
  UseAgentUpdate: { OnRunStatusChanged: "OnRunStatusChanged" },
  useThreads: () => threadsReturn,
  useCopilotChatConfiguration: () => configReturn,
  useAgent: () => agentReturn,
}));

// Desktop by default so the panel is a static region, not a dialog.
vi.mock("./use-is-mobile", () => ({ useIsMobile: () => false }));

function resetHooks(): void {
  threadsReturn = {
    threads: [],
    isLoading: false,
    listError: null,
    refetchThreads: vi.fn(),
    startNewThread: vi.fn(),
  };
  configReturn = {
    agentId: "vnstock_agent",
    threadId: null,
    setActiveThreadId: vi.fn(),
    startNewThread: vi.fn(),
  };
  agentReturn = { agent: { isRunning: false } };
}

function renderDrawer(
  overrides: Partial<Parameters<typeof ThreadsDrawer>[0]> = {},
) {
  return render(
    <ThreadsDrawer
      isOpen={false}
      onOpenChange={overrides.onOpenChange ?? vi.fn()}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  resetHooks();
});

describe("ThreadsDrawer (v2) — list states", () => {
  it("shows the empty state when there are no threads", () => {
    renderDrawer();
    expect(screen.getByTestId("drawer-empty")).toHaveTextContent(
      "No threads yet.",
    );
  });

  it("shows the loading state", () => {
    threadsReturn.isLoading = true;
    renderDrawer();
    expect(screen.getByTestId("drawer-loading")).toBeInTheDocument();
  });

  it("shows the error state with a Retry that refetches", () => {
    threadsReturn.listError = { message: "boom" };
    renderDrawer();
    expect(screen.getByTestId("drawer-error")).toHaveTextContent("boom");
    fireEvent.click(screen.getByTestId("drawer-retry"));
    expect(threadsReturn.refetchThreads).toHaveBeenCalledTimes(1);
  });

  it("renders one row per thread and marks the active one", () => {
    threadsReturn.threads = [
      { id: "t1", title: "First" },
      { id: "t2", title: "Second" },
    ];
    configReturn!.threadId = "t2";
    renderDrawer();
    const items = screen.getAllByTestId("thread-item");
    expect(items).toHaveLength(2);
    const active = items.find((el) => el.dataset.threadId === "t2");
    expect(active).toHaveAttribute("data-active", "true");
    expect(active).toHaveAttribute("aria-selected", "true");
    const inactive = items.find((el) => el.dataset.threadId === "t1");
    expect(inactive).toHaveAttribute("data-active", "false");
  });
});

describe("ThreadsDrawer (v2) — thread actions", () => {
  it("selects a thread with explicit:true (the flag that triggers history replay)", () => {
    threadsReturn.threads = [{ id: "t1", title: "First" }];
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });
    fireEvent.click(screen.getByTestId("thread-item"));
    // The { explicit: true } second argument is what makes CopilotChat issue
    // /agent/:id/connect and replay history. Assert it precisely.
    expect(configReturn!.setActiveThreadId).toHaveBeenCalledWith("t1", {
      explicit: true,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("selects a thread via keyboard (Enter)", () => {
    threadsReturn.threads = [{ id: "t1", title: "First" }];
    renderDrawer();
    fireEvent.keyDown(screen.getByTestId("thread-item"), { key: "Enter" });
    expect(configReturn!.setActiveThreadId).toHaveBeenCalledWith("t1", {
      explicit: true,
    });
  });

  it("new thread resets BOTH the useThreads store and the chat configuration", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });
    fireEvent.click(screen.getByTestId("new-thread"));
    expect(threadsReturn.startNewThread).toHaveBeenCalledTimes(1);
    expect(configReturn!.startNewThread).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("ThreadsDrawer (v2) — refetch after a run completes", () => {
  it("refetches when the agent transitions running -> not running", () => {
    agentReturn = { agent: { isRunning: true } };
    const { rerender } = renderDrawer();
    expect(threadsReturn.refetchThreads).not.toHaveBeenCalled();
    // Run finishes.
    agentReturn = { agent: { isRunning: false } };
    rerender(<ThreadsDrawer isOpen={false} onOpenChange={vi.fn()} />);
    expect(threadsReturn.refetchThreads).toHaveBeenCalledTimes(1);
  });

  it("does not refetch on a spurious re-render with no status change", () => {
    agentReturn = { agent: { isRunning: false } };
    const { rerender } = renderDrawer();
    rerender(<ThreadsDrawer isOpen={false} onOpenChange={vi.fn()} />);
    expect(threadsReturn.refetchThreads).not.toHaveBeenCalled();
  });
});

describe("ThreadsDrawer (v2) — chrome", () => {
  it("shows the launcher when closed and marks the agent", () => {
    renderDrawer();
    expect(screen.getByTestId("drawer-launcher")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-agent-name")).toHaveTextContent(
      "vnstock_agent",
    );
  });

  it("closes on Escape when open", () => {
    const onOpenChange = vi.fn();
    renderDrawer({ isOpen: true, onOpenChange });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("degrades gracefully when rendered outside the configuration provider", () => {
    configReturn = null;
    expect(() => renderDrawer()).not.toThrow();
    expect(screen.getByTestId("drawer-agent-name")).toHaveTextContent(
      "vnstock_agent",
    );
  });
});
