/**
 * jsdom ships no canvas implementation, and the `upmind-ui` barrel pulls in
 * `lottie-web`, which probes `getContext("2d")` at import time and dies on the
 * null it gets back. A no-op 2D context keeps the barrel importable.
 */
const context = new Proxy(
  {},
  { get: () => () => undefined }
) as CanvasRenderingContext2D;

HTMLCanvasElement.prototype.getContext = (() =>
  context) as HTMLCanvasElement["getContext"];

/**
 * PRE-EXISTING headless barrel cycle, not this package's:
 * `modules/scope` → `scope.utils` → `modules/session-store` → …
 * → `client-company.services.ts` → `modules/client-email` → back into
 * `modules/scope` while it is still initialising, so `useClientEmails.ts`
 * reads `createScopedComposable` as `undefined`. Entering the graph at
 * `client-email` first orders the cycle so `scope` completes before
 * `useClientEmails` evaluates. The same crash is live and RED in the
 * labs-nuxt component lane (`app/components/inspector/__tests__/`).
 */
await import("../headless/src/modules/client-email");
