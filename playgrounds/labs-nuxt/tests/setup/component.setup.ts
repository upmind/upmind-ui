// jsdom has no canvas backend; `@upmind-automation/upmind-ui` pulls in
// `lottie-web`, which probes `HTMLCanvasElement#getContext('2d')` at import
// time. Stub just enough of the 2D context surface for that probe to no-op.
HTMLCanvasElement.prototype.getContext = (() => ({
  fillRect: () => undefined,
  clearRect: () => undefined,
  getImageData: () => ({ data: [] }),
  putImageData: () => undefined,
  createImageData: () => [],
  setTransform: () => undefined,
  drawImage: () => undefined,
  save: () => undefined,
  restore: () => undefined,
  beginPath: () => undefined,
  moveTo: () => undefined,
  lineTo: () => undefined,
  closePath: () => undefined,
  stroke: () => undefined,
  translate: () => undefined,
  scale: () => undefined,
  rotate: () => undefined,
  arc: () => undefined,
  fill: () => undefined,
  measureText: () => ({ width: 0 })
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;
