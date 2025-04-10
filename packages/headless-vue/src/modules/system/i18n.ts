// --- external
import { computed, ref } from "vue";

// --- internal
// import type { ImageObjectTypes } from "@upmind-automation/headless";
import { useI18n as useHeadlessI18n } from "@upmind-automation/headless";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
// -----------------------------------------------------------------------------

export const useI18n = () => {
  const { getLocale, setLocale, getSupportedlocales, isReady } =
    useHeadlessI18n();

  const loading = ref<boolean>(true);
  const processing = ref<boolean>(false);
  const locale = ref<string>();

  // ---------------------------------------------------------------------------

  isReady().then(() => {
    locale.value = getLocale();
    loading.value = false;
  });

  // ---------------------------------------------------------------------------
  return {
    getLocale,
    setLocale: async (newLocale: string) => {
      processing.value = true;
      setLocale(newLocale)
        .then(value => (locale.value = value))
        .finally(() => {
          processing.value = false;
        });
    },
    supportedLocales: computed(() => getSupportedlocales()),
    locale: computed(() => locale.value),
    meta: computed(() => ({
      isLoading: loading.value,
      isProcessing: processing.value,
      isAvailable: !isEmpty(getSupportedlocales()),
      hasLocale: !isEmpty(locale.value),
    })),
  };
};
