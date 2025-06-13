import { Page } from "@playwright/test";

export class Basket {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  selectors() {
    return {
      expandConfigurations: () =>
        this.page.getByRole("link", {
          name: "Expand all configurations",
        }),
    };
  }
}
