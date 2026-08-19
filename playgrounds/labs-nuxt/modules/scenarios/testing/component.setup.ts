import { config } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import confirm from "@upmind-automation/i18n/core/confirm-en.json";
import error from "@upmind-automation/i18n/core/error-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import validation from "@upmind-automation/i18n/core/validation-en.json";
import labs from "@upmind-automation/i18n/modules/labs-en.json";

// lottie-web (icon-animated's dep, reached through `packages/ui`'s barrel)
// probes canvas support at import time; jsdom has no native 2D context, so a
// bare barrel import throws before any test runs. Stub only what that probe
// touches. It sits in the lane's setup rather than per spec because
// `setupFiles` are evaluated before any test file loads, so one stub serves
// every mount — this file imports no barrel of its own.
HTMLCanvasElement.prototype.getContext = (() => ({
  fillStyle: "",
  fillRect: () => {}
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

/**
 * The factory surfaces call `useI18n()` in `setup`, which throws without an
 * installed plugin — so every component mount in this project gets one, built
 * from the REAL `packages/i18n/src` catalogue (`src`, never `public/locales`,
 * which is the Localazy download target). A stub catalogue would let a surface
 * render a raw key and still pass. `labs` is the playground's own module
 * namespace, installed beside the core six so a surface that renders a
 * `DisplayRow` reads real copy rather than a raw `labs.*` key.
 */
config.global.plugins = [
  createI18n({
    legacy: false,
    locale: "en",
    messages: { en: { action, confirm, error, form, labs, text, validation } }
  })
];
