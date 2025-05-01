import { Locator, Page } from "@playwright/test";

export class Accordion {
  readonly accordionItem: Locator;

  constructor(page: Page) {
    this.accordionItem = page.getByTestId("accordion-item");
  }

  getAccordion(number: number) {
    return this.accordionItem.nth(number);
  }

  async clickAccordion(number: number) {
    const clickAccordionItem = this.getAccordion(number);
    await clickAccordionItem.click();
  }
}
