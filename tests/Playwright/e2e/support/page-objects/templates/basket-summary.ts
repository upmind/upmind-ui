import { Page, Locator } from "@playwright/test";

/** The kinds of configuration line the itemised summary carries. */
export const SUMMARY_LINE_KINDS = {
  TERM: "term",
  OPTION: "option",
  ATTRIBUTE: "attribute"
} as const;

export type SummaryLineKind =
  (typeof SUMMARY_LINE_KINDS)[keyof typeof SUMMARY_LINE_KINDS];

/**
 * Page object for the basket summary in BOTH its presentations — the itemised
 * configuration breakdown and the plain-totals list. The summary is one
 * component rendered by the basket aside, the checkout step and the register
 * step alike, so this reads it wherever it appears.
 *
 * The itemised handles (`basket-summary-breakdown`, `summary-product`,
 * `summary-line`, ...) are the ones docs/sdd/FE-2943/design.md §4.1 specifies;
 * the plain-totals handles (`description-list`, `promotions-form`, the `Total`
 * label reader) already existed and must keep working in both presentations.
 */
export class BasketSummary {
  readonly page: Page;
  /** The summary's section — a stable DOM id on every step that renders it. */
  readonly section: Locator;
  /**
   * The itemised presentation's region. Its ABSENCE is how a spec proves the
   * plain-totals presentation is the one on screen.
   */
  readonly breakdown: Locator;
  /** One node per product block in the itemised presentation. */
  readonly productBlocks: Locator;
  /** Every configuration line in the itemised presentation. */
  readonly lines: Locator;
  /** The plain-totals lists. */
  readonly totalsLists: Locator;
  /** A plain-totals product row. */
  readonly plainProductRows: Locator;
  /** The grand total, located by its label inside the summary. */
  readonly totalValue: Locator;
  /** The promotion-code field, wherever in the summary it renders. */
  readonly promotionForm: Locator;
  /** The promotion-code field, counted across the whole step. */
  readonly promotionFormsOnStep: Locator;

  constructor(page: Page) {
    this.page = page;
    this.section = page.locator("#basket-summary");
    this.breakdown = page.getByTestId("basket-summary-breakdown");
    this.productBlocks = this.breakdown.getByTestId("summary-product");
    this.lines = this.breakdown.getByTestId("summary-line");
    this.totalsLists = this.section.getByTestId("description-list");
    this.plainProductRows = this.section
      .getByTestId("description-list-item")
      .and(page.locator(`[data-test-value="product"]`));
    this.totalValue = this.section
      .locator("dt", { hasText: /^Total$/ })
      .locator("xpath=following-sibling::dd[1]");
    this.promotionForm = this.section.getByTestId("promotions-form");
    this.promotionFormsOnStep = page.getByTestId("promotions-form");
  }

  /** The block for one basket product, selected by the id it carries. */
  productBlock(basketProductId: string): Locator {
    return this.productBlocks.and(
      this.page.locator(`[data-test-value="${basketProductId}"]`)
    );
  }

  /** That product's all-units figure. */
  productTotal(block: Locator): Locator {
    return block.getByTestId("summary-product-total");
  }

  /** That product's single-unit figure (rendered above quantity 1). */
  productUnitPrice(block: Locator): Locator {
    return block.getByTestId("summary-product-unit-price");
  }

  /** Every configuration line inside one product block. */
  productLines(block: Locator): Locator {
    return block.getByTestId("summary-line");
  }

  /** The configuration lines of one kind inside one product block. */
  productLinesOfKind(block: Locator, kind: SummaryLineKind): Locator {
    return this.productLines(block).and(
      this.page.locator(`[data-test-value="${kind}"]`)
    );
  }

  /** One line's figure — including the explicit no-price placeholder. */
  linePrice(line: Locator): Locator {
    return line.getByTestId("summary-line-price");
  }

  /** The rendered text of every line of one kind, in document order. */
  async lineTexts(block: Locator, kind: SummaryLineKind): Promise<string[]> {
    return this.productLinesOfKind(block, kind).allInnerTexts();
  }
}
