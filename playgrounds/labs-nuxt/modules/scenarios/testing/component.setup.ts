import { config } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import confirm from "@upmind-automation/i18n/core/confirm-en.json";
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
    messages: { en: { action, confirm, error, form, text, validation } }
  })
];
