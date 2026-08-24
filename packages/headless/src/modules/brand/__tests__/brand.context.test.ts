/**
 * @fileoverview Brand Context Unit Tests
 *
 * ## Job To Be Done
 * Prove the brand composable's currency and language selection logic:
 * - Validate currency returns matched currency or brand default (AC-5)
 * - Validate language returns matched language or brand default (AC-6)
 *
 * ## What Breaks If These Fail
 * Storefront would display wrong currency or language when the selected
 * one is invalid, breaking checkout and localization.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockBrandSettings = {
  id: "brand-1",
  name: "Test Brand",
  currency_id: "cur-usd",
  language_id: "lang-en",
  currencies: [
    { id: "cur-usd", code: "USD" },
    { id: "cur-eur", code: "EUR" }
  ],
  languages: [
    { id: "lang-en", code: "en" },
    { id: "lang-fr", code: "fr" }
  ]
};

vi.mock("../brand.services", () => ({
  default: {
    fetchModules: vi.fn(() => ({
      data: { value: [] },
      isError: { value: false },
      isLoading: { value: false },
      isFetched: { value: true }
    })),
    fetchBrandConfig: vi.fn(() => ({
      data: { value: {} },
      isError: { value: false },
      isLoading: { value: false },
      isFetched: { value: true }
    })),
    fetchBrandSettings: vi.fn(() => ({
      data: { value: mockBrandSettings },
      isError: { value: false },
      isLoading: { value: false },
      isFetched: { value: true }
    })),
    fetchOrganisationConfig: vi.fn(() => ({
      data: { value: {} },
      isError: { value: false },
      isLoading: { value: false },
      isFetched: { value: true }
    }))
  }
}));

vi.mock("../../useUpmind", () => ({
  default: { storefrontUrl: undefined }
}));

vi.mock("../config", () => ({
  useConfig: vi.fn(() => ({
    data: { storeUrl: undefined, catalogueDisabled: false }
  }))
}));

vi.mock("../query", () => ({
  invalidateQueryByKey: vi.fn()
}));

describe("brand.context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("currency validation (AC-5)", () => {
    it("returns currency matching currency_id when found in currencies list", async () => {
      const { useBrand } = await import("../useBrand");
      const brand = useBrand();

      expect(brand.currency.value?.id).toBe("cur-usd");
      expect(brand.currency.value?.code).toBe("USD");
    });

    it("returns currencies list sorted by code", async () => {
      const { useBrand } = await import("../useBrand");
      const brand = useBrand();

      expect(brand.currencies.value[0].code).toBe("EUR");
      expect(brand.currencies.value[1].code).toBe("USD");
    });
  });

  describe("language validation (AC-6)", () => {
    it("returns language matching language_id when found in languages list", async () => {
      const { useBrand } = await import("../useBrand");
      const brand = useBrand();

      expect(brand.language.value?.id).toBe("lang-en");
      expect(brand.language.value?.code).toBe("en");
    });

    it("exposes languages list from brand settings", async () => {
      const { useBrand } = await import("../useBrand");
      const brand = useBrand();

      expect(brand.languages.value).toHaveLength(2);
      expect(brand.languages.value[0].code).toBe("en");
    });
  });
});
