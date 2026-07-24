import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AG_UI_AGENT_NAME, COPILOTKIT_RUNTIME_URL } from "@/lib/copilotkit";
import { CopilotProvider } from "./copilot-provider";

let kitProps: Record<string, unknown> = {};
let configProps: Record<string, unknown> = {};
vi.mock("@copilotkit/react-core/v2", () => ({
  CopilotKitProvider: (props: Record<string, unknown>) => {
    kitProps = props;
    return (
      <div data-testid="kit-provider">{props.children as React.ReactNode}</div>
    );
  },
  CopilotChatConfigurationProvider: (props: Record<string, unknown>) => {
    configProps = props;
    return (
      <div data-testid="config-provider">
        {props.children as React.ReactNode}
      </div>
    );
  },
}));

describe("CopilotProvider (v2)", () => {
  it("renders children through both providers", () => {
    render(
      <CopilotProvider>
        <span data-testid="child">hi</span>
      </CopilotProvider>,
    );
    expect(screen.getByTestId("kit-provider")).toBeInTheDocument();
    expect(screen.getByTestId("config-provider")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("wires runtimeUrl to CopilotKitProvider and agentId to the config provider", () => {
    render(<CopilotProvider>x</CopilotProvider>);
    expect(kitProps.runtimeUrl).toBe(COPILOTKIT_RUNTIME_URL);
    expect(configProps.agentId).toBe(AG_UI_AGENT_NAME);
  });

  it("honors prop overrides", () => {
    render(
      <CopilotProvider agentId="other_agent" runtimeUrl="/custom">
        x
      </CopilotProvider>,
    );
    expect(kitProps.runtimeUrl).toBe("/custom");
    expect(configProps.agentId).toBe("other_agent");
  });

  it("does NOT pass threadId (leaving it uncontrolled so setActiveThreadId works)", () => {
    render(<CopilotProvider>x</CopilotProvider>);
    // Passing threadId would make it controlled and turn setActiveThreadId into
    // a warn-and-no-op — the drawer relies on it being uncontrolled.
    expect("threadId" in configProps).toBe(false);
    expect("threadId" in kitProps).toBe(false);
  });
});
