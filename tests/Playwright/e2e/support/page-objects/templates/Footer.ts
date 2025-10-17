import { Page, Locator } from "@playwright/test";

export class Footer {
  readonly page: Page;
  readonly languageSelector: Locator;

  constructor(page: Page) {
    this.page = page;
    this.languageSelector = page.getByTestId("locale-selector");
  }
}
