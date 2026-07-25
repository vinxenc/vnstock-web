import {
  AG_UI_AGENT_NAME,
  COPILOTKIT_RUNTIME_URL,
  DEFAULT_AG_UI_BACKEND_URL,
  getAgUiBackendUrl,
} from "@/lib/copilotkit";

describe("copilotkit", () => {
  describe("constants", () => {
    it("DEFAULT_AG_UI_BACKEND_URL is the local default", () => {
      expect(DEFAULT_AG_UI_BACKEND_URL).toBe("http://127.0.0.1:7933");
    });

    it("COPILOTKIT_RUNTIME_URL is the same-origin API path", () => {
      expect(COPILOTKIT_RUNTIME_URL).toBe("/api/copilotkit");
    });

    it("AG_UI_AGENT_NAME is a non-empty string", () => {
      expect(typeof AG_UI_AGENT_NAME).toBe("string");
      expect(AG_UI_AGENT_NAME.length).toBeGreaterThan(0);
      expect(AG_UI_AGENT_NAME).toBe("vnstock_agent");
    });
  });

  describe("getAgUiBackendUrl", () => {
    it("returns a custom URL when AG_UI_BACKEND_URL is set", () => {
      const result = getAgUiBackendUrl({
        AG_UI_BACKEND_URL: "https://api.example.com/agent",
      });
      expect(result).toBe("https://api.example.com/agent");
    });

    it("returns the default when AG_UI_BACKEND_URL is unset", () => {
      const result = getAgUiBackendUrl({});
      expect(result).toBe(DEFAULT_AG_UI_BACKEND_URL);
    });

    it("returns the default when AG_UI_BACKEND_URL is an empty string", () => {
      const result = getAgUiBackendUrl({ AG_UI_BACKEND_URL: "" });
      expect(result).toBe(DEFAULT_AG_UI_BACKEND_URL);
    });

    it("returns the default when AG_UI_BACKEND_URL is only whitespace", () => {
      const result = getAgUiBackendUrl({ AG_UI_BACKEND_URL: "   " });
      expect(result).toBe(DEFAULT_AG_UI_BACKEND_URL);
    });

    it("returns the default when AG_UI_BACKEND_URL is only tabs and newlines", () => {
      const result = getAgUiBackendUrl({ AG_UI_BACKEND_URL: "\t\n  " });
      expect(result).toBe(DEFAULT_AG_UI_BACKEND_URL);
    });

    it("trims whitespace from the custom URL", () => {
      const result = getAgUiBackendUrl({
        AG_UI_BACKEND_URL: "  https://api.example.com/agent  \n",
      });
      expect(result).toBe("https://api.example.com/agent");
    });

    it("uses process.env by default when no env parameter is passed", () => {
      // This test verifies the signature allows calling without arguments.
      // The actual behavior depends on what is in process.env at test time,
      // which we cannot control here. We just verify it doesn't throw.
      const result = getAgUiBackendUrl();
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
