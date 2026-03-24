import { Locator, Page } from "@playwright/test";

export class Markdown {
  readonly markdown: Locator;

  constructor(page: Page) {
    this.markdown = page.getByTestId("markdown");
  }

  getMarkdown(container: Locator) {
    const getMarkdown = container.locator(this.markdown);
    return getMarkdown;
  }
}
