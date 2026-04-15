import { Locator, Page } from "@playwright/test";

export class Lineclamp {
  readonly lineclamp: Locator;

  constructor(page: Page) {
    this.lineclamp = page.getByTestId("lineclamp");
  }

  getLineclamp(container: Locator) {
    const getLineclamp = container.locator(this.lineclamp);
    return getLineclamp;
  }

  async clickLineclamp() {
    await this.lineclamp.click();
  }
}
