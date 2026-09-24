import { computed } from "vue";
import { useBrand, useTheming } from "@upmind-automation/headless";
import { useBrandConfig } from "../brand";
import { COLOR_SCHEME } from "./theming.types";
import { useThemeEngine } from "./useThemeEngine";
import type { BrandThemeMeta, ColorScheme } from "./theming.types";

const DEFAULT_THEME_ID = "default";

export const useBrandTheme = () => {
  const { config, isReady } = useBrandConfig();
  const { themes, meta: themingMeta } = useTheming();
  const { uiTheme } = useBrand();
  const engine = useThemeEngine();

  const available = computed(() => (themes.value ?? []).map(theme => theme.id));

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

    available,

    selected,

    colorScheme,

    apply: () => engine.set(selected.value)
  };
};

export type UseBrandTheme = ReturnType<typeof useBrandTheme>;
