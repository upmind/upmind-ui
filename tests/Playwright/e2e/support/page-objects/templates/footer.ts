import { Page, Locator } from "@playwright/test";

export class Footer {
  readonly page: Page;
  readonly languageSelector: Locator;
  readonly currencySelector: Locator;
  // The Combobox value span carries an explicit, locale-stable testid plus a
  // `data-test-value` holding the selected CODE (currency code / locale code),
  // not the translated display name — read the code via `data-test-value`.
  readonly currencyValue: Locator;
  readonly languageValue: Locator;

  constructor(page: Page) {
    this.page = page;
    this.languageSelector = page.getByTestId("locale-selector");
    this.currencySelector = page.getByTestId("currency-selector");
    this.currencyValue = page.getByTestId("currency-selector-value");
    this.languageValue = page.getByTestId("language-selector-value");
  }
}
