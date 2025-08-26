import { Locator, Page } from "@playwright/test";

export class Popover {
  readonly popoverTrigger: Locator;
  readonly popoverContent: Locator;

  constructor(page: Page) {
    this.popoverTrigger = page.getByTestId("popover-trigger");
    this.popoverContent = page.getByTestId("popover-content");
  }
}
