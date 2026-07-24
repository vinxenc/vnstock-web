"use client";
import { CopilotChat } from "@copilotkit/react-core/v2";

export interface ChatProps {
  readonly onSubmitMessage?: (message: string) => void;
  readonly className?: string;
}

/**
 * v2 chat surface. `agentId` and `threadId` are inherited from the surrounding
 * `CopilotChatConfigurationProvider` (copilotkit-BLh58_Tt.mjs:8027-8031), so
 * this component takes neither.
 *
 * v1's `labels.initial` / `labels.placeholder` do not exist on v2; the
 * equivalents are `welcomeMessageText` and `chatInputPlaceholder`
 * (copilotkit-CN_LykOC.d.mts:517-539).
 */
export function Chat({
  onSubmitMessage,
  className = "flex-1 min-h-0",
}: ChatProps): React.JSX.Element {
  return (
    <CopilotChat
      className={className}
      onSubmitMessage={onSubmitMessage}
      labels={{
        welcomeMessageText: "Hi! Ask me about the Vietnamese stock market.",
        chatInputPlaceholder: "Type your message…",
      }}
    />
  );
}
