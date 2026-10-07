/**
 * @fileoverview Unit-layer stub of `@upmind-automation/headless`.
 *
 * ## Job To Be Done
 * Drive brand and theming state as a reactive input, with no network and no machine.
 */

import { vi } from "vitest";
import { computed, ref } from "vue";

export type StubTheme = {
  id: string;
  name: string;
  icon?: string;
  tokens?: string;
};

export type StubBrand = {
  id: string;
  name: string;
  isAvailable: boolean;
  themeId?: string;
  brandColor?: string;
  brandFont?: string;
  faviconUrl?: string;
  colorSchemeVariant?: string;
};

const NO_BRAND: StubBrand = { id: "", name: "", isAvailable: false };

export const stubState = {
  brand: ref<StubBrand>({ ...NO_BRAND }),
  themes: ref<StubTheme[] | undefined>(undefined)
};

export function setThemes(themes: StubTheme[] | undefined) {
  stubState.themes.value = themes;
}

const useBrand = () => {
  const brand = computed(() => stubState.brand.value);

  return {
    isReady: () => Promise.resolve(brand.value.isAvailable),
    hasModuleEnabled: () => true,
    meta: computed(() => ({
      isEmpty: !brand.value.isAvailable,
      hasError: false,
      isLoading: false,
      isComplete: true,
      isAvailable: brand.value.isAvailable
    })),
    brandId: computed(() => brand.value.id),
    name: computed(() => brand.value.name),
    errors: computed(() => []),
    favicon: computed(() => {
      if (!brand.value.faviconUrl) return null;
      return {
        url: brand.value.faviconUrl,
        public_url: brand.value.faviconUrl
      };
    }),
    image: computed(() => null),
    styles: computed(() => {
      if (!brand.value.brandColor && !brand.value.brandFont) return null;
      return {
        brand_color: brand.value.brandColor ?? "",
        brand_font: brand.value.brandFont
          ? { family: brand.value.brandFont, version: "1" }
          : undefined
      };
    }),
    uiTheme: computed(() => ({
      tokens: "",
      variant: brand.value.colorSchemeVariant
    })),
    uiCart: computed(() => ({ ui: {} })),
    uischema: computed(() => ({})),
    uischema_Display: computed(() => undefined),
    uischema_Route: computed(() => ({})),
    i18nMessages: computed(() => undefined),
    language: computed(() => undefined),
    languages: computed(() => []),
    currency: computed(() => undefined),
    currencyId: computed(() => ""),
    currencies: computed(() => []),
    countryId: computed(() => ""),
    hasStorefront: computed(() => false),
    storefrontUrl: computed(() => undefined),
    storefrontRoute: computed(() => null),
    hasUpmindBranding: computed(() => true),
    ensureConfig: () => Promise.resolve({}),
    getAnalytics: () => Promise.resolve({}),
    getConfig: () => ({}),
    getConfigValue: () => undefined,
    refresh: () => Promise.resolve(),
    invalidate: () => {}
  };
};

const useTheming = () => ({
  isReady: () => Promise.resolve(stubState.brand.value.isAvailable),
  meta: computed(() => ({
    isAvailable: stubState.brand.value.isAvailable,
    hasThemes: (stubState.themes.value ?? []).length > 0
  })),
  themes: stubState.themes
});

const useConfig = () => ({
  data: {},
  ui: {
    theme: computed(() => stubState.brand.value.themeId ?? ""),
    iconVariant: computed(() => "outline")
  }
});

const UIContext = { ALL: "all", CART: "cart", CHECKOUT: "checkout" };

export async function createHeadlessStub() {
  const { Store } = await vi.importActual<
    typeof import("@upmind-automation/headless")
  >("@upmind-automation/headless");

  return { useBrand, useTheming, useConfig, UIContext, Store };
}
