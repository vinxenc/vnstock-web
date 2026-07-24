/**
 * Row labels for the threads drawer.
 *
 * On a self-hosted SSE runtime the thread list comes from `InMemoryAgentRunner`,
 * which always reports `name: null` (in-memory.mjs:234-243) and rejects renames
 * (`threadEndpoints.mutations === false`). So every row needs a deterministic,
 * request-free fallback label.
 */

/** Shape of a thread row that the label needs. `Thread` satisfies it structurally. */
export interface ThreadLabelSource {
  readonly id: string;
  readonly name: string | null;
}

export const UNTITLED_THREAD_PREFIX = "Conversation";
export const UNTITLED_THREAD_ID_LENGTH = 8;

/** True when the thread has no usable server-provided name. */
export function isUntitledThread(thread: ThreadLabelSource): boolean {
  return (thread.name ?? "").trim().length === 0;
}

/**
 * `name` when non-blank, otherwise `"Conversation <first 8 chars of id>"`.
 * Ids shorter than 8 characters are used whole — never padded, never throws.
 */
export function formatThreadLabel(thread: ThreadLabelSource): string {
  const name = (thread.name ?? "").trim();
  if (name.length > 0) return name;
  return `${UNTITLED_THREAD_PREFIX} ${thread.id.slice(0, UNTITLED_THREAD_ID_LENGTH)}`;
}
