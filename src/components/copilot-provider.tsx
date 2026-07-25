"use client";
import {
  CopilotChatConfigurationProvider,
  CopilotKitProvider,
} from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";
import { AG_UI_AGENT_NAME, COPILOTKIT_RUNTIME_URL } from "@/lib/copilotkit";

export interface CopilotProviderProps {
  readonly children: ReactNode;
  /** Agent key registered in the runtime. Defaults to AG_UI_AGENT_NAME. */
  readonly agentId?: string;
  /** Runtime endpoint. Defaults to COPILOTKIT_RUNTIME_URL. */
  readonly runtimeUrl?: string;
}

/**
 * v2 provider pair.
 *
 * `CopilotKitProvider` has no `agent` and no `threadId` prop
 * (copilotkit-CN_LykOC.d.mts:3101-3232) — both live on
 * `CopilotChatConfigurationProvider` (…:615-623), which additionally exposes
 * `setActiveThreadId` / `startNewThread` (…:584-613). The threads drawer drives
 * those, so the configuration provider MUST wrap both the drawer and the chat.
 *
 * `threadId` is deliberately NOT passed: passing it makes the thread id
 * "controlled" and turns `setActiveThreadId()` into a warn-and-no-op
 * (copilotkit-BLh58_Tt.mjs:264-274).
 */
export function CopilotProvider({
  children,
  agentId = AG_UI_AGENT_NAME,
  runtimeUrl = COPILOTKIT_RUNTIME_URL,
}: CopilotProviderProps): React.JSX.Element {
  return (
    <CopilotKitProvider runtimeUrl={runtimeUrl}>
      <CopilotChatConfigurationProvider agentId={agentId}>
        {children}
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  );
}
