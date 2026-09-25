import { computed } from "vue";
import { useBrand, useConfig } from "@upmind-automation/headless";
import { ensureBrandConfig } from "./brand.cache";
import type { BrandConfig, BrandConfigMeta } from "./brand.types";

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

  // `basket: undefined` opts out of the per-user basket wiring.
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

    id: computed(() => brandId.value),

    config
  };
};

export type UseBrandConfig = ReturnType<typeof useBrandConfig>;
