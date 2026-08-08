import { config } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import error from "@upmind-automation/i18n/core/error-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import validation from "@upmind-automation/i18n/core/validation-en.json";

/**
 * The factory surfaces call `useI18n()` in `setup`, which throws without an
 * installed plugin — so every component mount in this project gets one, built
 * from the REAL `packages/i18n/src/core` catalogue (`src`, never
 * `public/locales`, which is the Localazy download target). A stub catalogue
 * would let a surface render a raw key and still pass.
 */
config.global.plugins = [
  createI18n({
    legacy: false,
    locale: "en",
    messages: { en: { action, error, form, text, validation } }
  })
];

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
