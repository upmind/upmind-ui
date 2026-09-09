// -----------------------------------------------------------------------------
/**
 * @module plugins/i18n
 * @description The first of the two host seams the `@upmind-automation/auth`
 * organisms need. `vue-i18n` is a peer dependency of every ADR 023 domain
 * package, so a host that mounts one has to install an instance; without it
 * `useI18n()` throws on first setup and the route renders an error page.
 *
 * The portal's own mocked screens still read plain strings — nothing here
 * changes them.
 */
import i18n from "~/portal/i18n";

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(i18n);
});
