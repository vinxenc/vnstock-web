import { HttpAgent } from "@ag-ui/client";
import {
  CopilotSseRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import {
  AG_UI_AGENT_NAME,
  COPILOTKIT_RUNTIME_URL,
  getAgUiBackendUrl,
} from "@/lib/copilotkit";

// The CopilotKit runtime uses Node APIs and streams SSE.
export const runtime = "nodejs";
// Still a valid segment-config value on Next 16.2.10
// (next/dist/build/segment-config/app/app-segment-config.js:82-87).
// It is only removed when `cacheComponents` is enabled in next.config.ts.
export const dynamic = "force-dynamic";

// `CopilotSseRuntime` is the non-shim SSE runtime; `CopilotRuntime` is a
// documented compatibility shim (runtime.mjs:106-113).
// No `runner` is passed, so it defaults to `new InMemoryAgentRunner()`
// (runtime.mjs:56) — which is what turns on the license-free thread endpoints
// (`GET /threads`, `GET /threads/:id/messages`) and lets `/agent/:id/connect`
// replay a thread's history without ever calling `HttpAgent.connect()`.
const copilotRuntime = new CopilotSseRuntime({
  agents: {
    [AG_UI_AGENT_NAME]: new HttpAgent({ url: getAgUiBackendUrl() }),
  },
});

// Framework-agnostic `(Request) => Promise<Response>`; no Hono, no adapter.
// `cors` is intentionally omitted: this endpoint is same-origin only, and
// omitting it emits no CORS headers at all (fetch-handler.mjs:376-380).
const handleCopilotRequest = createCopilotRuntimeHandler({
  runtime: copilotRuntime,
  basePath: COPILOTKIT_RUNTIME_URL,
});

export const GET = (request: Request): Promise<Response> =>
  handleCopilotRequest(request);
export const POST = (request: Request): Promise<Response> =>
  handleCopilotRequest(request);
export const PATCH = (request: Request): Promise<Response> =>
  handleCopilotRequest(request);
export const DELETE = (request: Request): Promise<Response> =>
  handleCopilotRequest(request);
