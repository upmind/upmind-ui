import { Locator, Page } from "@playwright/test";
import { kebabCase } from "../../helpers/strings";

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

  getAccordion(option: string) {
    return this.page.getByTestId(`accordion-item-${kebabCase(option)}`);
  }

  async clickAccordion(option: string) {
    const clickAccordionItem = this.getAccordion(option);
    await clickAccordionItem.click();
  }
}
