import { createI18n } from "vue-i18n";
import { htmlModifier, markdownModifier } from "@upmind-automation/i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import confirm from "@upmind-automation/i18n/core/confirm-en.json";
import error from "@upmind-automation/i18n/core/error-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import validation from "@upmind-automation/i18n/core/validation-en.json";
import labs from "@upmind-automation/i18n/modules/labs-en.json";

export default defineNuxtPlugin(nuxtApp => {
  const i18n = createI18n({
    legacy: false,
    locale: "en",
    fallbackLocale: "en",
    // The catalogue the component lane already installs
    // (`modules/scenarios/testing/component.setup.ts`). It used to be `{}`
    // here, so the running app resolved NO key: every label rendered blank or
    // as its own key while the specs — which DO load these — passed asserting
    // real copy. Silenced warnings hid it.
    messages: { en: { action, confirm, error, form, labs, text, validation } },
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
