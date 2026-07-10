import { Locator, Page } from "@playwright/test";

export class Accordion {
  readonly page: Page;
  readonly accordionItem: Locator;
  readonly accordionTrigger: Locator;
  readonly accordionContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accordionItem = page.getByTestId("accordion-item");
    this.accordionTrigger = this.accordionItem.getByTestId("accordion-trigger");
    this.accordionContent = this.accordionItem.getByTestId("accordion-content");
  }

  /**
   * @param slug - Stable accordion item slug (NOT a translated label), e.g.
   *   `register` → `accordion-item-register`.
   */
  getAccordion(slug: string) {
    return this.page
      .getByTestId("accordion-item")
      .and(this.page.locator(`[data-test-value="${slug}"]`));
  }

  async clickAccordion(slug: string) {
    const clickAccordionItem = this.getAccordion(slug);
    await clickAccordionItem.click();
  }
}
