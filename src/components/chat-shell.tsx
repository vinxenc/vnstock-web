"use client";
import { useState, type ReactNode } from "react";
import { CopilotProvider } from "./copilot-provider";
import { ThreadsDrawer } from "./threads-drawer";

export interface ChatShellProps {
  readonly children: ReactNode;
}

/**
 * Grid shell: persistent thread rail + full-bleed chat pane, matching the
 * official v2 example's `drawer | minmax(0,1fr)` layout.
 *
 * Two v1 mechanisms are deliberately gone:
 *  - the `style={COPILOTKIT_THEME}` map of `--copilot-kit-*` variables: those
 *    properties do not exist in v2's stylesheet (0 matches in
 *    react-core/dist/v2/index.css). Theming is now `html.dark` + the tokens
 *    v2 scopes to `[data-copilotkit]`.
 *  - the `key={activeThreadId}` remount: v2's CopilotChat handles an in-place
 *    threadId change and its cleanup swallows detach rejections
 *    (`agent.detachActiveRun().catch(() => {})`, copilotkit-BLh58_Tt.mjs:8122).
 *    Remounting on switch would throw away the replayed history.
 */
export function ChatShell({ children }: ChatShellProps): React.JSX.Element {
  // Mobile off-canvas open state.
  const [isOpen, setIsOpen] = useState(false);
  // Desktop collapse state — independent of the mobile drawer.
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <CopilotProvider>
      <div
        data-testid="chat-shell"
        data-collapsed={isCollapsed ? "true" : "false"}
        className={[
          "grid h-dvh w-full overflow-hidden bg-background text-foreground grid-cols-1",
          isCollapsed
            ? "md:grid-cols-1"
            : "md:grid-cols-[var(--cpk-drawer-reserved-width,320px)_minmax(0,1fr)]",
        ].join(" ")}
      >
        <ThreadsDrawer
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          isCollapsed={isCollapsed}
          onCollapsedChange={setIsCollapsed}
        />
        <main
          className={[
            "col-auto flex min-h-0 min-w-0 flex-col overflow-hidden",
            "pt-16",
            isCollapsed ? "md:col-auto md:pt-16" : "md:col-start-2 md:pt-0",
          ].join(" ")}
        >
          {children}
        </main>
      </div>
    </CopilotProvider>
  );
}
