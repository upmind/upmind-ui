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
