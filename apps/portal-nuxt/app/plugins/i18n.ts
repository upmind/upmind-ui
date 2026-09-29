// -----------------------------------------------------------------------------
/**
 * @module plugins/i18n
 * @description Installs the `vue-i18n` instance the `@upmind-automation/auth` organisms need.
 */
import i18n from "~/portal/i18n";

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(i18n);
});
