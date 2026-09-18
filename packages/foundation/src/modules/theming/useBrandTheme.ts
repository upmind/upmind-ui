import { computed } from "vue";
import { useBrand, useTheming } from "@upmind-automation/headless";
import { useBrandConfig } from "../brand";
import { COLOR_SCHEME } from "./theming.types";
import { useThemeEngine } from "./useThemeEngine";
import { map } from "lodash-es";
import type { BrandThemeMeta, ColorScheme } from "./theming.types";

const DEFAULT_THEME_ID = "default";

/**
 * Selects the brand's theme from the themes `headless` serves and applies it
 * through `ui`'s engine. Reads the engine; never implements one.
 */
export const useBrandTheme = () => {
  const { config, isReady } = useBrandConfig();
  const { themes, meta: themingMeta } = useTheming();
  const { uiTheme } = useBrand();
  const engine = useThemeEngine();

  const available = computed(() => map(themes.value, theme => theme.id));

  const selected = computed(() => {
    const preferred = config.value?.themeId;

    if (preferred && available.value.includes(preferred)) return preferred;

    return available.value[0] ?? DEFAULT_THEME_ID;
  });

  const colorScheme = computed((): ColorScheme | undefined => {
    if (uiTheme.value?.variant === COLOR_SCHEME.DARK) return COLOR_SCHEME.DARK;

    return undefined;
  });

  const meta = computed(
    (): BrandThemeMeta => ({
      isAvailable: themingMeta.value.isAvailable,
      hasThemes: themingMeta.value.hasThemes
    })
  );

  return {
    isReady,
    meta,

    themes,

    /** Every theme id the brand bundle offers. */
    available,

    /** The theme id the brand resolves to. */
    selected,

    /** The brand's preferred colour scheme, when it declares one. */
    colorScheme,

    /** Hands the selected theme to `ui`'s engine; warns when none is provided. */
    apply: () => engine.set(selected.value)
  };
};

export type UseBrandTheme = ReturnType<typeof useBrandTheme>;
