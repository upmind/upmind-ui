import { Page, Locator } from "@playwright/test";

export class Drawer {
  readonly drawerOverlay: Locator;
  readonly domainResults: Locator;
  readonly domainItem: Locator;
  readonly domainButton: Locator;

  constructor(page: Page) {
    this.drawerOverlay = page.getByTestId("drawer-overlay");
    this.domainResults = page.getByTestId("dac-results");
    this.domainItem = page.getByTestId("checkbox-item");
    this.domainButton = page.getByTestId("button-default");
  }
}
