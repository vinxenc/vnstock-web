// Registers the jest-dom matchers (toBeInTheDocument, etc.) and their types.
// React Testing Library's automatic cleanup is provided separately by
// @testing-library/react itself, which registers it when a global afterEach
// is available (Vitest's `globals: true`).
import "@testing-library/jest-dom/vitest";
