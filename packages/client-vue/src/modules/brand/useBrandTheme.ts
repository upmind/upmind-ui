// --- external
import { ref, computed } from "vue";

// --- internal
import { useBrand } from "@upmind-automation/headless";

// --- utils
import {
  setBrandFavicon,
  setBrandFontFamily,
  setBrandTheme,
  setBrandTitle
} from "./utils";
import { isEmpty, keys, get, isEqual, first } from "lodash-es";

// --- types
import type { Theme } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------
/**
 * Composable for managing and applying the current brand theme.
 * Provides theme theme, available variants, and a method to apply the theme to the document.
 *
 * @returns {Object} Brand theme composable API
 */
export const useBrandTheme = (initial?: Theme) => {
  const {
    meta: brandMeta,
    uiTheme,
    favicon,
    name,
    styles,
    isReady: isBrandReady
  } = useBrand();

  // --- state

  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (brandMeta.value.isAvailable && !isEmpty(available.value)) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  }

  // --- context

  // the theme definition
  const theme = ref<Theme | undefined>(initial);
  const available = computed(() => uiTheme.value?.variants);

  const meta = computed(() => ({
    isAvailable: brandMeta.value.isAvailable,
    hasSettings:
      brandMeta.value.isAvailable &&
      (isEmpty(available.value) || !isEmpty(theme.value))
  }));

  // --- methods
  const set = (value: string) => {
    if (isEqual(theme.value?.id, value)) return;

    const config = get(uiTheme.value, ["variants", value]);
    if (config) {
      theme.value = setBrandTheme(value, config);
    }
    // Apply the theme to the document
    apply();
  };

  async function apply() {
    setBrandTitle(name.value);
    setBrandFontFamily(styles.value?.brand_font?.family ?? "Inter Tight");
    setBrandFavicon(favicon.value);
  }

  // --- Side Effects

  isBrandReady().then(() => {
    // if we've already set a theme, don't set it again
    if (!isEmpty(theme.value)) return;

    // otherwise honour the preferred variant from the UI meta
    // if no variant is set, use the first available one
    // if no variants are available, use the default `upmind` variant

    const variant =
      uiTheme.value?.variant ?? first(keys(available.value)) ?? "upmind";

    // Otherwis get the available brands variants
    set(variant);
  });

  // ---------------------------------------------------------------------------

  return {
    // --- state
    isReady,

    /** Meta information about the brand theme state. */
    meta,

    // --- context

    /** The computed theme theme for the selected theme variant. */
    theme: computed(() => theme.value),

    selected: computed(() => theme.value?.id || "default"),

    available: computed(() => keys(available.value)),

    // --- state
    /** The current theme key (readonly). */

    // --- methods
    /** Sets the current theme key. */
    set,

    /** Applies the current brand theme to the document (title, font, favicon). Waits for brand context to be ready. */
    apply
  };
};
