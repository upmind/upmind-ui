import { Locator, Page } from "@playwright/test";

export class Accordion {
  readonly accordionItem: Locator;
  readonly accordionTrigger: Locator;
  readonly accordionContent: Locator;

  constructor(page: Page) {
    this.accordionItem = page.getByTestId("accordion-item");
    this.accordionTrigger = this.accordionItem.getByTestId("accordion-trigger");
    this.accordionContent = this.accordionItem.getByTestId("accordion-content");
  }

  getAccordion(number: number) {
    return this.accordionItem.nth(number);
  }

  async clickAccordion(number: number) {
    const clickAccordionItem = this.getAccordion(number);
    await clickAccordionItem.click();
  }
}
