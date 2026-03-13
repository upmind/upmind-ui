import { Page, Locator } from "@playwright/test";

export class Pagination {
  readonly paginationBar: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;

  constructor(page: Page) {
    this.paginationBar = page.getByTestId("pagination-bar");
    this.nextButton = page.getByTestId("next");
    this.previousButton = page.getByTestId("previous");
  }

  clickNext() {
    return this.nextButton.click();
  }

  clickPrevious() {
    return this.previousButton.click();
  }
}
