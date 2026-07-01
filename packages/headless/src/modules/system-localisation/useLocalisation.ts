// -- -external
import { computed, ref, unref } from "vue";
import { useI18n } from "./useI18n";
import { useLocale } from "./useLocale";
import type { GlobbedFiles } from "./system-localisation.types";
import type { I18n } from "vue-i18n";
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------

/**
 * Composable function to manage and initialise localisation settings in headless with an associated i18n instance and optionally globbed messages.
 * Provides utilities to configure, load locale messages, and manage the application's locale state.
 */
export const useLocalisation = (instance?: I18n, glob?: GlobbedFiles) => {
  const { locale, setDefaultLocale, setLocale } = useLocale();
  const { loadLocaleMessages, init } = useI18n();

  const loading = ref<boolean>(true);
  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (!loading.value) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  }

  const meta = computed(() => ({
    isAvailable: !!instance,
    isLoading: loading.value
  }));

  // --- side effects

  // Start by initialising our i18n instance with the provided instance/globbed files
  if (instance) init(instance, glob);

  // Then set our default locale from the i18n instance
  const defaultLocale = unref(instance?.global?.locale ?? locale.value);

  // Then load the message pack(s) for the default locale and the current locale
  // NB ALWAYS load the default locale, so we can use it as a fallback
  // AS well as the current locale ( assuming its available)
  // finally set the locale we want to use ( knowing the messages are loaded )

  setDefaultLocale(defaultLocale)
    .then(() => {
      if (!instance) return;
      Promise.all([
        loadLocaleMessages(defaultLocale),
        loadLocaleMessages(locale.value)
      ]);
    })
    .then(() => setLocale(locale.value))
    .finally(() => {
      loading.value = false;
    });

  // ---------------------------------------------------------------------------

  return {
    // --- state
    isReady,

    /** Meta information about the brand theme state. */
    meta

    // --- context
  };
};
