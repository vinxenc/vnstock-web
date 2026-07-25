"use client";
import {
  UseAgentUpdate,
  useAgent,
  useCopilotChatConfiguration,
  useThreads,
} from "@copilotkit/react-core/v2";
import { useCallback, useEffect, useRef, useState } from "react";
import { AG_UI_AGENT_NAME } from "@/lib/copilotkit";
import { formatThreadLabel, isUntitledThread } from "@/lib/thread-label";
import { useIsMobile } from "./use-is-mobile";

export interface ThreadsDrawerProps {
  /** Mobile off-canvas open state. Ignored visually at >=768px. */
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Desktop collapse state. Ignored visually below 768px. Default false. */
  readonly isCollapsed?: boolean;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
  /** Accessible name for the drawer region/dialog (aria-label). Default "Threads". */
  readonly label?: string;
  /** Section heading above the list. Default "Recent Conversations". */
  readonly recentLabel?: string;
  /** Agent whose threads to list. Default AG_UI_AGENT_NAME. */
  readonly agentId?: string;
}

/** Inline lucide SVG: panel-left icon. Source: copilotkit-threads-drawer.mjs:92-107 */
const PanelLeftIcon = (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

/** Inline lucide SVG: square-plus icon. Source: copilotkit-threads-drawer.mjs:109-126 */
const SquarePlusIcon = (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

export function ThreadsDrawer({
  isOpen,
  onOpenChange,
  isCollapsed = false,
  onCollapsedChange,
  label = "Threads",
  recentLabel = "Recent Conversations",
  agentId,
}: ThreadsDrawerProps): React.JSX.Element {
  // May be null outside the configuration provider — degrade gracefully (spec §6.2 pt.1).
  const configuration = useCopilotChatConfiguration();
  const resolvedAgentId = agentId ?? configuration?.agentId ?? AG_UI_AGENT_NAME;

  const { threads, isLoading, listError, refetchThreads, startNewThread } =
    useThreads({ agentId: resolvedAgentId });

  const activeThreadId = configuration?.threadId ?? null;

  // Refresh the list once after a run completes (spec §6.2 pt.7).
  // A new thread only appears in GET /threads after its first run persists (in-memory.mjs:231).
  const { agent } = useAgent({
    agentId: resolvedAgentId,
    updates: [UseAgentUpdate.OnRunStatusChanged],
  });
  const isRunning = Boolean(agent?.isRunning);
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !isRunning) refetchThreads();
    wasRunning.current = isRunning;
  }, [isRunning, refetchThreads]);

  const isMobile = useIsMobile();

  // Escape key closes the drawer on mobile.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onOpenChange]);

  const handleNewThread = useCallback(() => {
    // Reset both the useThreads store and the chat configuration so the
    // welcome screen shows (hasExplicitThreadId becomes false).
    // Mirrors CopilotThreadsDrawer's own handler (copilotkit-BLh58_Tt.mjs:9202-9206).
    startNewThread();
    configuration?.startNewThread();
    onOpenChange(false);
  }, [startNewThread, configuration, onOpenChange]);

  const handleSelectThread = useCallback(
    (id: string) => {
      // `explicit: true` is what makes CopilotChat issue /agent/:id/connect
      // and replay history (copilotkit-BLh58_Tt.mjs:8090-8098).
      configuration?.setActiveThreadId(id, { explicit: true });
      onOpenChange(false);
    },
    [configuration, onOpenChange],
  );

  // Roving-tabindex arrow-key navigation for the listbox (ARIA APG pattern):
  // the list is a single Tab stop; Up/Down/Home/End move focus between options,
  // and the focused option becomes the tab stop so Tab re-enters the last row.
  const [focusedThreadId, setFocusedThreadId] = useState<string | null>(null);
  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement>) => {
      const options = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>('[role="option"]'),
      );
      const current = options.indexOf(document.activeElement as HTMLElement);
      let next: number;
      switch (e.key) {
        case "ArrowDown":
          next = current < 0 ? 0 : Math.min(current + 1, options.length - 1);
          break;
        case "ArrowUp":
          next = current <= 0 ? 0 : current - 1;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = options.length - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      const target = options[next];
      target?.focus();
      setFocusedThreadId(target?.dataset.threadId ?? null);
    },
    [],
  );

  // List body — exactly one of: error, loading, empty, or list (spec §6.2 pt.8).
  let listBody: React.JSX.Element;
  if (listError) {
    listBody = (
      <>
        <p
          data-testid="drawer-error"
          className="px-[10px] py-2 text-sm text-[var(--destructive)]"
        >
          {listError.message}
        </p>
        <button
          type="button"
          data-testid="drawer-retry"
          onClick={() => refetchThreads()}
          className="mx-[10px] mt-1 rounded-[var(--cpk-radius,4px)] px-3 py-1 text-xs hover:bg-[var(--muted)]"
        >
          Retry
        </button>
      </>
    );
  } else if (isLoading) {
    listBody = (
      <p
        data-testid="drawer-loading"
        aria-busy="true"
        className="px-[10px] py-2 text-sm text-[var(--muted-foreground)]"
      >
        Loading…
      </p>
    );
  } else if (threads.length === 0) {
    listBody = (
      <p
        data-testid="drawer-empty"
        className="px-[10px] py-2 text-sm text-[var(--muted-foreground)]"
      >
        No threads yet.
      </p>
    );
  } else {
    // The single tab stop follows the last arrow-navigated row (when it still
    // exists), otherwise the active thread, otherwise the first row.
    const focusedExists =
      focusedThreadId != null && threads.some((t) => t.id === focusedThreadId);
    const tabStopId =
      (focusedExists ? focusedThreadId : null) ??
      (activeThreadId && threads.some((t) => t.id === activeThreadId)
        ? activeThreadId
        : null) ??
      threads[0]?.id ??
      null;
    listBody = (
      <ul
        role="listbox"
        aria-label={label}
        data-testid="thread-list"
        className="flex flex-col gap-1"
        onKeyDown={handleListKeyDown}
      >
        {threads.map((thread) => {
          const active = thread.id === activeThreadId;
          const unnamed = isUntitledThread(thread);
          // Roving tabindex: exactly one row is the Tab stop; the rest are
          // reachable via arrow keys.
          const tabStop = thread.id === tabStopId;
          return (
            <li
              key={thread.id}
              role="option"
              aria-selected={active}
              data-testid="thread-item"
              data-active={active ? "true" : "false"}
              data-unnamed={unnamed ? "true" : undefined}
              data-thread-id={thread.id}
              title={formatThreadLabel(thread)}
              tabIndex={tabStop ? 0 : -1}
              onClick={() => handleSelectThread(thread.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectThread(thread.id);
                }
              }}
              className={[
                "flex cursor-pointer items-center gap-2 rounded-[var(--cpk-radius,4px)] border border-transparent px-[10px] py-2",
                "hover:bg-[var(--muted)]",
                active
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "",
              ].join(" ")}
            >
              <span
                data-testid="thread-name"
                className={[
                  "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm truncate",
                  unnamed ? "text-[var(--muted-foreground)] italic" : "",
                ].join(" ")}
              >
                {formatThreadLabel(thread)}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  // Off-canvas and hidden on mobile: exclude the whole panel from focus and the
  // a11y tree (the desktop-collapsed path already does this via `md:hidden`).
  const offscreen = isMobile && !isOpen;

  return (
    <>
      {/* 1. Backdrop — only when open on mobile */}
      {isOpen ? (
        <button
          type="button"
          data-testid="drawer-backdrop"
          aria-label="Close threads drawer"
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-[999] bg-black/40 md:hidden"
        />
      ) : null}

      {/* 2. Panel */}
      <aside
        id="threads-drawer"
        data-testid="threads-drawer"
        inert={offscreen || undefined}
        role={isMobile && isOpen ? "dialog" : "region"}
        aria-modal={isMobile && isOpen ? true : undefined}
        aria-label={label}
        className={[
          // Desktop: static in grid track, full height, border-right
          "flex h-full flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--background)]",
          "w-[var(--cpk-drawer-width,320px)]",
          // Mobile: fixed off-canvas, slides in
          "fixed inset-y-0 left-0 z-[1000] md:static md:z-auto",
          "transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop collapse removes the panel entirely; the launcher reopens it.
          isCollapsed ? "md:hidden" : "",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 p-3">
          <span className="flex-1 font-semibold tracking-tight">vnstock</span>
          {/* Hide button — closes the mobile drawer, collapses the desktop rail */}
          <button
            type="button"
            data-testid="drawer-hide"
            aria-label="Hide threads"
            aria-expanded={true}
            aria-controls="threads-drawer"
            onClick={() => {
              // Set both: only one is visually active per breakpoint, and this
              // stays correct even if matchMedia is unavailable.
              onOpenChange(false);
              onCollapsedChange?.(true);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--cpk-radius,4px)] hover:bg-[var(--muted)]"
          >
            {PanelLeftIcon}
          </button>
        </div>

        {/* New Conversation row */}
        <div className="mx-3">
          <button
            type="button"
            data-testid="new-thread"
            onClick={handleNewThread}
            className="flex w-full items-center gap-3 rounded-[var(--cpk-radius,4px)] px-[10px] py-2 hover:bg-[var(--muted)]"
          >
            {SquarePlusIcon}
            <span>New Conversation</span>
          </button>
        </div>

        {/* Section heading */}
        <h2
          data-testid="recent-heading"
          className="mx-3 px-[10px] py-2 text-[11px] font-semibold tracking-[0.02em] text-[var(--muted-foreground)]"
        >
          {recentLabel}
        </h2>

        {/* Thread list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          {listBody}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[var(--border)] p-3 text-[11px] text-[var(--muted-foreground)]">
          <p data-testid="history-hint" className="mb-1">
            History is kept in the runtime process and is cleared when the
            server restarts.
          </p>
          <span data-testid="drawer-agent-name" className="block font-mono">
            {resolvedAgentId}
          </span>
        </div>
      </aside>

      {/* 3. Launcher cluster — mobile when closed, desktop when collapsed */}
      {!isOpen || isCollapsed ? (
        <div
          data-testid="drawer-launcher"
          className={[
            "fixed left-4 top-4 z-[998] inline-flex gap-0.5 rounded-[var(--cpk-radius,4px)] border border-[var(--border)] bg-[var(--card)] p-1.5 shadow-[var(--shadow-md,0_4px_6px_-1px_rgb(0_0_0/.1))]",
            // Below md the launcher shows whenever the drawer is closed; at md+
            // it only shows once the rail is collapsed.
            isCollapsed ? "" : "md:hidden",
          ].join(" ")}
        >
          <button
            type="button"
            data-testid="drawer-show"
            aria-label="Open threads"
            aria-expanded={false}
            aria-controls="threads-drawer"
            onClick={() => {
              // Set both: only one is visually active per breakpoint, and this
              // stays correct even if matchMedia is unavailable.
              onOpenChange(true);
              onCollapsedChange?.(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--cpk-radius,4px)] hover:bg-[var(--muted)]"
          >
            {PanelLeftIcon}
          </button>
        </div>
      ) : null}
    </>
  );
}
