import { ref, computed } from "vue";
import { useBrand, useTheming } from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import { UIContext } from "@upmind-automation/headless";
import { setIconVariant } from "../../components/icon";
import { COLOR_MODE } from "./types";
import { useColorMode } from "./useColorMode";
import {
  setDocumentFavicon,
  setDisplayFontLink,
  setFontVariables,
  loadGoogleFonts,
  setDocumentTitle,
  setTokens,
  deriveBrandTheme
} from "./utils";
import {
  isEmpty,
  isEqual,
  find,
  first,
  forEach,
  capitalize,
  map
} from "lodash-es";
import type { Theme } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
// --- global context

const DEFAULT_THEME = "default";
const theme = ref<Theme | undefined>(undefined);
const availableThemes = ref<Theme[]>([]);
let defaultTheme = DEFAULT_THEME;

function applyTheme(value: Theme["id"]) {
  const id = value === DEFAULT_THEME ? defaultTheme : value;

  theme.value =
    (find(availableThemes.value, ["id", id]) as Theme | undefined) ??
    first(availableThemes.value);

  if (typeof document !== "undefined" && document.body) {
    document.body.dataset.theme = theme.value?.id ?? id;
  }
}

export const useThemes = () => ({ set: applyTheme });

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

  const { themes } = useTheming();
  const { data, ui } = useConfig({ context: UIContext.ALL });

  // --- state

  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts += 1;
        if (brandMeta.value.isAvailable) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts >= 50) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
    });
  }

  // --- context

  const meta = computed(() => ({
    isAvailable: brandMeta.value.isAvailable,
    hasSettings: brandMeta.value.isAvailable,
    hasTheme: !isEmpty(theme.value)
  }));

  // --- methods
  const set = (value: Theme["id"]) => {
    if (isEqual(theme.value?.id, value)) return;

    applyTheme(value);

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

    setIconVariant(capitalize(ui.iconVariant.value));
    setDocumentTitle(name.value);
    setDocumentFavicon(favicon.value ?? undefined);
  };

  // --- Side Effects
  isBrandReady().then(() => {
    const brandId = ui.theme.value || DEFAULT_THEME;
    const brandColor = styles.value?.brand_color;
    const brandTheme = brandColor
      ? deriveBrandTheme({
          id: brandId,
          name: name.value || "Brand",
          primary: brandColor,
          font: styles.value?.brand_font?.family
        })
      : undefined;

    // Explicit API tokens must override the palette derived from brand_color.
    if (brandTheme) setTokens(brandTheme);
    forEach(themes.value, setTokens);

    availableThemes.value = [...(themes.value ?? [])];
    if (brandTheme && !find(availableThemes.value, ["id", brandTheme.id])) {
      availableThemes.value.push(brandTheme);
    }

    defaultTheme = initial ?? brandId;
    useColorMode().setBrandPreferred(
      uiTheme.value?.variant === COLOR_MODE.DARK ? COLOR_MODE.DARK : undefined
    );

    set(defaultTheme);
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

    themes: computed((): Theme[] => availableThemes.value),

    selected: computed(() => theme.value?.id || DEFAULT_THEME),

    available: computed(() => map(availableThemes.value, "id")),

    // --- state
    /** The current theme key (readonly). */

    // --- methods
    /** Sets the current theme key. */
    set
  };
};

export type UseTheme = ReturnType<typeof useTheme>;
