import { createI18n } from "vue-i18n";
import { htmlModifier, markdownModifier } from "@upmind-automation/i18n";

export default defineNuxtPlugin(nuxtApp => {
  const i18n = createI18n({
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

  nuxtApp.vueApp.use(i18n);

  return {
    provide: { i18n }
  };
});
