import { computed } from "vue";
import { useBrand, useConfig } from "@upmind-automation/headless";
import {
  cachedBrandIds,
  ensureBrandConfig,
  invalidateBrandConfig
} from "./brand.cache";
import type { BrandConfig, BrandConfigMeta } from "./brand.types";

/**
 * Resolves the brand's invariant config and caches it under the BE
 * settings-bundle id (ADR 023 §10 Axis 1).
 */
export const useBrandConfig = () => {
  const {
    brandId,
    name,
    favicon,
    styles,
    uiCart,
    isReady,
    meta: brandMeta
  } = useBrand();

  // `basket: undefined` opts out of the per-user basket wiring, which would pull
  // Axis 2 state into a brand-invariant read.
  const { ui } = useConfig({ brand: () => uiCart.value, basket: undefined });

  const config = computed((): BrandConfig | undefined => {
    const id = brandId.value;

    if (!id) return undefined;

    return ensureBrandConfig(id, () => ({
      id,
      name: name.value,
      faviconUrl: favicon.value?.full_url,
      themeId: ui.theme.value,
      brandColor: styles.value?.brand_color,
      brandFont: styles.value?.brand_font?.family
    }));
  });

  const meta = computed(
    (): BrandConfigMeta => ({
      isAvailable: brandMeta.value.isAvailable,
      isResolved: config.value !== undefined
    })
  );

  return {
    isReady,
    meta,

    /** The settings-bundle id the cache is keyed by. */
    id: computed(() => brandId.value),

    config,

    /** Every brand id currently held, for cache inspection. */
    cachedIds: cachedBrandIds,

    /** Busts one brand's cached config, or all of them. */
    invalidate: invalidateBrandConfig
  };
};

export type UseBrandConfig = ReturnType<typeof useBrandConfig>;
