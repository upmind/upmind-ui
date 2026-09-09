// -----------------------------------------------------------------------------
/**
 * @module portal/i18n
 * @description The app's single `vue-i18n` instance. It lives in a module
 * rather than a plugin injection so both the plugin that installs it and the
 * headless init that hands it over read the same value with the same type —
 * this app is SPA-only (`ssr: false`), so there is no request scope to leak.
 */
import { createI18n } from "vue-i18n";
import { htmlModifier, markdownModifier } from "@upmind-automation/i18n";
import type { I18n } from "vue-i18n";

const i18n: I18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {},
  missingWarn: false,
  fallbackWarn: false,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  modifiers: {
    html: htmlModifier,
    markdown: markdownModifier
  }
});

export default i18n;
