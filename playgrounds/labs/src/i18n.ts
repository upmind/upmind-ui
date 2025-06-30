import { createI18n } from "vue-i18n";

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {},
  // ---
  missingWarn: false,
  fallbackWarn: false,
  silentTranslationWarn: true,
  silentFallbackWarn: true
});

export default i18n;
