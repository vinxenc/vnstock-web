import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "./page";

// Mock the Chat component
vi.mock("@/components/chat", () => ({
  Chat: () => <div data-testid="chat-component">Chat Surface</div>,
}));

describe("Home page", () => {
  it("renders the Chat component", () => {
    const { getByTestId } = render(<Home />);
    expect(getByTestId("chat-component")).toBeInTheDocument();
  });

  it("displays chat surface with correct text", () => {
    const { getByText } = render(<Home />);
    expect(getByText("Chat Surface")).toBeInTheDocument();
  });
});
