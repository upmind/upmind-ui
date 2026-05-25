import { test, expect, Page } from "@playwright/test";
import { waitForSessionCookie } from "../../support/helpers";

const singleLanguage = [
  {
    id: "3825d96e-763e-d091-3dc4-174825283406",
    language: "English",
    code: "en",
    created_at: "2017-10-18 14:16:22",
    updated_at: "2017-10-18 14:16:22",
    pivot: {
      brand_id: "2785d26e-9678-3d16-999f-314502e70439",
      language_id: "3825d96e-763e-d091-3dc4-174825283406"
    }
  }
];

const singleCurrency = [
  {
    id: "3825d96e-763e-d091-3dc4-174825283406",
    name: "British Pound",
    prefix: "£",
    suffix: "",
    code: "GBP",
    created_at: "2017-10-18 14:16:22",
    updated_at: "2026-01-07 13:30:26",
    base: true,
    decimals: true,
    manual: 0
  }
];

const multipleLanguages = [
  {
    id: "3825d96e-763e-d091-3dc4-174825283406",
    language: "English",
    code: "en",
    created_at: "2017-10-18 14:16:22",
    updated_at: "2017-10-18 14:16:22",
    pivot: {
      brand_id: "2785d26e-9678-3d16-999f-314502e70439",
      language_id: "3825d96e-763e-d091-3dc4-174825283406"
    }
  },
  {
    id: "85d085e6-9d56-2371-9ea2-18e940d42370",
    language: "Danish",
    code: "da",
    created_at: "2017-10-18 14:16:22",
    updated_at: "2017-10-18 14:16:22",
    pivot: {
      brand_id: "2785d26e-9678-3d16-999f-314502e70439",
      language_id: "85d085e6-9d56-2371-9ea2-18e940d42370"
    }
  }
];

const multipleCurrencies = [
  {
    id: "3825d96e-763e-d091-3dc4-174825283406",
    name: "British Pound",
    prefix: "£",
    suffix: "",
    code: "GBP",
    created_at: "2017-10-18 14:16:22",
    updated_at: "2026-01-07 13:30:26",
    base: true,
    decimals: true,
    manual: 0
  },
  {
    id: "45952098-d3de-4091-76a3-1578626e347e",
    name: "Australian Dollar",
    prefix: "AU $",
    suffix: "",
    code: "AUD",
    created_at: "2020-02-12 09:02:29",
    updated_at: "2026-01-07 13:30:27",
    base: true,
    decimals: true,
    manual: 0
  }
];

const interceptLanguageAndCurrency = async (
  page: Page,
  languageArray: any[],
  currencyArray: any[]
) => {
  await page.route("**/api/brand/settings**", async route => {
    const response = await route.fetch();
    const json = await response.json();
    json.data.languages = languageArray;
    json.data.currencies = currencyArray;
    await route.fulfill({ response, json });
  });
};

test.describe("Footer - Language and Currency controls", () => {
  test("Locale/Currency selectors not present when there is only 1 currency and 1 language", async ({
    page
  }) => {
    interceptLanguageAndCurrency(page, singleLanguage, singleCurrency);
    await page.goto("/");
    await page.waitForURL("/order/shop/");
    await waitForSessionCookie(page.context());
    await expect(page.getByTestId("locale-selector")).not.toBeVisible();
    await expect(page.getByTestId("currency-selector")).not.toBeVisible();
  });
  test("Single currency, multiple languages", async ({ page }) => {
    interceptLanguageAndCurrency(page, multipleLanguages, singleCurrency);
    await page.goto("/");
    await page.waitForURL("/order/shop/");
    await waitForSessionCookie(page.context());
    await expect(page.getByTestId("locale-selector")).toBeVisible();
    await expect(page.getByTestId("currency-selector")).not.toBeVisible();
  });
  test("Multiple currency, single language", async ({ page }) => {
    interceptLanguageAndCurrency(page, singleLanguage, multipleCurrencies);
    await page.goto("/");
    await page.waitForURL("/order/shop/");
    await waitForSessionCookie(page.context());
    await expect(page.getByTestId("locale-selector")).not.toBeVisible();
    await expect(page.getByTestId("currency-selector")).toBeVisible();
  });
  test("Multiple currency, multiple languages", async ({ page }) => {
    interceptLanguageAndCurrency(page, multipleLanguages, multipleCurrencies);
    await page.goto("/");
    await page.waitForURL("/order/shop/");
    await waitForSessionCookie(page.context());
    await expect(page.getByTestId("locale-selector")).toBeVisible();
    await expect(page.getByTestId("currency-selector")).toBeVisible();
  });
});
