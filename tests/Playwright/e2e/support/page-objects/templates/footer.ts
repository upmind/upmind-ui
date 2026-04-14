import { Page, Locator } from "@playwright/test";

export class Footer {
  readonly page: Page;
  readonly languageSelector: Locator;
  readonly currencySelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.languageSelector = page.getByTestId("locale-selector");
    this.currencySelector = page.getByTestId("currency-selector");
  }
}
