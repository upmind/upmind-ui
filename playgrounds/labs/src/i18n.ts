import { createI18n, type I18n } from "vue-i18n";
import { htmlModifier, markdownModifier } from "@upmind-automation/i18n";

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {},
  // ---
  missingWarn: false,
  fallbackWarn: false,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  modifiers: {
    html: htmlModifier,
    markdown: markdownModifier
  }
});

export default i18n as I18n;
