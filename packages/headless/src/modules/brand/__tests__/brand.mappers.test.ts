/**
 * @fileoverview Brand Mappers Unit Tests
 *
 * ## Job To Be Done
 * Prove the brand mapper functions transform API responses correctly:
 * - mapBrandConfig merges template nulls with fetched values (AC-7)
 * - mapBrandSettings transforms i18n from key-first to locale-first (AC-8)
 *
 * ## What Breaks If These Fail
 * Brand config values would be missing or malformed, breaking storefront
 * configuration. i18n translations would be in the wrong structure,
 * breaking vue-i18n integration.
 */

import { describe, it, expect } from "vitest";
import { mapBrandConfig, mapBrandSettings } from "../brand.mappers";
import type { BrandConfigKeys, IBrandSettings } from "@upmind-automation/types";

describe("brand.mappers", () => {
  describe("mapBrandConfig (AC-7)", () => {
    it("returns fetched values for keys present in the data", () => {
      const data = {
        "ui.basket.default_currency": "USD",
        "ui.locale": "en-GB"
      };
      const keys = [
        "ui.basket.default_currency",
        "ui.locale"
      ] as BrandConfigKeys[];

      const result = mapBrandConfig(data, keys);

      expect(result).toHaveProperty("ui.basket.default_currency", "USD");
      expect(result).toHaveProperty("ui.locale", "en-GB");
    });

    it("sets requested keys to null when not present in fetched data", () => {
      const data = {};
      const keys = ["ui.basket.default_currency"] as BrandConfigKeys[];

      const result = mapBrandConfig(data, keys);

      expect(result).toHaveProperty("ui.basket.default_currency", null);
    });

    it("preserves nested key structure via lodash set/get", () => {
      const data = { "a.b.c": "deep" };
      const keys = ["a.b.c"] as BrandConfigKeys[];

      const result = mapBrandConfig(data, keys);

      expect(result).toHaveProperty("a.b.c", "deep");
    });
  });

  describe("mapBrandSettings (AC-8)", () => {
    it("transforms i18n from key-first to locale-first structure", () => {
      const rawSettings = {
        id: "brand-1",
        name: "Test Brand",
        meta: {
          i18n: {
            "cart.title": { en: "Cart", fr: "Panier" },
            "checkout.title": { en: "Checkout", fr: "Paiement" }
          }
        },
        languages: [{ code: "en" }, { code: "fr" }]
      } as unknown as IBrandSettings;

      const result = mapBrandSettings(rawSettings);
      const i18n = result.meta?.i18n as Record<string, Record<string, string>>;

      expect(i18n?.en?.["cart.title"]).toBe("Cart");
      expect(i18n?.fr?.["cart.title"]).toBe("Panier");
      expect(i18n?.en?.["checkout.title"]).toBe("Checkout");
      expect(i18n?.fr?.["checkout.title"]).toBe("Paiement");
    });

    it("preserves other settings fields unchanged", () => {
      const rawSettings = {
        id: "brand-1",
        name: "Test Brand",
        currency_id: "cur-1",
        currencies: [{ id: "cur-1", code: "USD" }],
        languages: [{ code: "en" }],
        meta: { i18n: {} }
      } as unknown as IBrandSettings;

      const result = mapBrandSettings(rawSettings);

      expect(result.id).toBe("brand-1");
      expect(result.name).toBe("Test Brand");
      expect(result.currency_id).toBe("cur-1");
      expect(result.currencies).toHaveLength(1);
    });
  });
});
