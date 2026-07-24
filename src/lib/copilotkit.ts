/**
 * Shared constants and helpers for CopilotKit / AG-UI integration.
 * Safe to import in both server and client modules (no side effects).
 */

/** Default URL of the AG-UI backend when the env var is unset or blank. */
export const DEFAULT_AG_UI_BACKEND_URL = "http://127.0.0.1:7933";

/** Same-origin path the browser posts to; used by the provider and route handler. */
export const COPILOTKIT_RUNTIME_URL = "/api/copilotkit";

/** Key used to register the AG-UI agent in the runtime and select it in the provider. */
export const AG_UI_AGENT_NAME = "vnstock_agent";

/**
 * Resolve the AG-UI backend URL from the environment, trimming whitespace.
 * Falls back to `DEFAULT_AG_UI_BACKEND_URL` when the variable is unset or blank.
 */
export function getAgUiBackendUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const url = env.AG_UI_BACKEND_URL?.trim();
  return url ? url : DEFAULT_AG_UI_BACKEND_URL;
}
