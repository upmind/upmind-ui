import { Locator, Page } from "@playwright/test";

export class Button {
  readonly button: Locator;

  constructor(page: Page) {
    this.button = page.getByRole("button");
  }

  getButton(container: Locator) {
    const getButton = container.locator(this.button);
    return getButton;
  }

  async clickButton(container: Locator) {
    const clickButton = this.getButton(container);
    await clickButton.click();
  }
}
