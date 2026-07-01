import { ref, computed } from "vue";
import { useBrand, useTheming } from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import { UIContext } from "@upmind-automation/headless";
import { useThemes, useThemeIcons } from "@upmind-automation/upmind-ui";
import {
  setDocumentFavicon,
  setDisplayFontLink,
  setFontVariables,
  loadGoogleFonts,
  setDocumentTitle,
  setTokens
} from "./utils";
import { isEmpty, keys, isEqual, find, forEach, capitalize } from "lodash-es";
import type { Theme } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
// --- global context

const theme = ref<Theme | undefined>(undefined);

// -----------------------------------------------------------------------------

/**
 * Composable for managing and applying the current brand theme.
 * Provides theme theme, available variants, and a method to apply the theme to the document.
 *
 * @returns {Object} Brand theme composable API
 */
export const useTheme = (initial?: string) => {
  const {
    meta: brandMeta,
    uiTheme,
    favicon,
    name,
    styles,
    isReady: isBrandReady
  } = useBrand();

  const { themes, meta: themingMeta } = useTheming();
  const { set: setUiTheme, add: addUiTheme } = useThemes(themes.value, initial);

  const { setIconTheme } = useThemeIcons();
  const { data, ui } = useConfig({ context: UIContext.ALL });

  // --- state

  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (brandMeta.value.isAvailable && !isEmpty(themes.value)) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  }

  // --- context

  const meta = computed(() => ({
    isAvailable: brandMeta.value.isAvailable,
    hasSettings: brandMeta.value.isAvailable && themingMeta.value.hasThemes,
    hasTheme: !isEmpty(theme.value)
  }));

  // --- methods
  const set = (value: Theme["id"]) => {
    if (isEqual(theme.value?.id, value)) return;

    theme.value = find(themes.value, ["id", value]) as Theme | undefined;

    if (!theme.value) {
      theme.value = find(themes.value, ["id"]) as Theme | undefined;
    }

    // Apply the theme to the document and UI lib
    if (data.displayFontLink) {
      setDisplayFontLink(data.displayFontLink).then(displayFont => {
        if (displayFont) {
          setFontVariables({ display: displayFont });
        }
      });
    } else {
      const displayFont = styles.value?.brand_font?.family;
      if (displayFont) {
        loadGoogleFonts({ display: displayFont });
        setFontVariables({ display: displayFont });
      }
    }

    setIconTheme(capitalize(ui.iconVariant.value));
    setUiTheme(theme.value?.id ?? "default");
    setDocumentTitle(name.value);
    setDocumentFavicon(favicon.value ?? undefined);
  };

  // --- Side Effects
  isBrandReady().then(() => {
    // honour the initial theme
    // if no initial theme provided, honour the preferred variant from the UI meta
    // if no variants are available, we honour the browser mode and use the default `upmind` variant

    const defaultTheme = "default";
    // TODO: once we have configured the DARK thee correctly
    //  window.matchMedia("(prefers-color-scheme: dark)")
    //   .matches
    //   ? "upmind-dark"
    //   : "upmind";

    const activeTheme = initial ?? uiTheme.value?.variant ?? defaultTheme;

    // ensure ALL our themes are added to the document
    forEach(themes.value, theme => {
      addUiTheme(theme, false);
      setTokens(theme);
    });

    set(activeTheme);
  });

  // ---------------------------------------------------------------------------

  return {
    // --- state
    isReady,

    /** Meta information about the brand theme state. */
    meta,

    // --- context

    /** The computed theme theme for the selected theme activeTheme. */
    theme: computed((): Theme | undefined => theme.value),

    themes: computed((): Theme[] => themes.value ?? []),

    selected: computed(() => theme.value?.id || "default"),

    available: computed(() => keys(themes.value)),

    // --- state
    /** The current theme key (readonly). */

    // --- methods
    /** Sets the current theme key. */
    set
  };
};
