import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Chat } from "./chat";

// Capture the props CopilotChat is rendered with.
let lastProps: Record<string, unknown> = {};
vi.mock("@copilotkit/react-core/v2", () => ({
  CopilotChat: (props: Record<string, unknown>) => {
    lastProps = props;
    return (
      <div data-testid="copilot-chat" className={props.className as string} />
    );
  },
}));

describe("Chat (v2)", () => {
  it("renders CopilotChat", () => {
    render(<Chat />);
    expect(screen.getByTestId("copilot-chat")).toBeInTheDocument();
  });

  it("passes the v2 label keys, not v1's initial/placeholder", () => {
    render(<Chat />);
    const labels = lastProps.labels as Record<string, string>;
    // v2 uses welcomeMessageText + chatInputPlaceholder.
    expect(labels.welcomeMessageText).toBe(
      "Hi! Ask me about the Vietnamese stock market.",
    );
    expect(labels.chatInputPlaceholder).toBe("Type your message…");
    // v1 keys must be absent.
    expect(labels.initial).toBeUndefined();
    expect(labels.placeholder).toBeUndefined();
  });

  it("forwards onSubmitMessage to CopilotChat", () => {
    const onSubmitMessage = vi.fn();
    render(<Chat onSubmitMessage={onSubmitMessage} />);
    // The wired callback must be the exact function we passed.
    expect(lastProps.onSubmitMessage).toBe(onSubmitMessage);
    (lastProps.onSubmitMessage as (m: string) => void)("hello");
    expect(onSubmitMessage).toHaveBeenCalledWith("hello");
  });

  it("defaults className to a flex-fill and honors an override", () => {
    const { rerender } = render(<Chat />);
    expect(screen.getByTestId("copilot-chat")).toHaveClass("flex-1", "min-h-0");
    rerender(<Chat className="custom-class" />);
    expect(screen.getByTestId("copilot-chat")).toHaveClass("custom-class");
  });
});
