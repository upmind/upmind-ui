import { Page, Locator, expect } from "@playwright/test";
import { URLs } from "../../constants/urls";

/**
 * Page object for the Domain Availability Checker. Used both on the
 * standalone `/domains/` page and inside the Register / Transfer accordions
 * on a product config page — the testids are shared between the two
 * surfaces so the same locators apply in either context.
 */
export class Dac {
  readonly page: Page;

  /* Cards */
  readonly cards: Locator;
  readonly firstCard: Locator;
  readonly results: Locator;

  /* Loading skeletons */
  readonly priceLoadingSkeletons: Locator;
  readonly buttonLoadingSkeletons: Locator;
  readonly descriptionLoadingSkeletons: Locator;

  /* Actions */
  readonly searchInput: Locator;
  readonly continueButton: Locator;
  readonly loadMoreButton: Locator;
  readonly cardAddToBasketButtons: Locator;

  constructor(page: Page) {
    this.page = page;

    this.cards = page.getByTestId("dac-card");
    this.firstCard = this.cards.first();
    this.results = page.getByTestId("dac-results");

    this.priceLoadingSkeletons = page.getByTestId("dac-card-price-loading");
    this.buttonLoadingSkeletons = page.getByTestId("dac-card-button-loading");
    this.descriptionLoadingSkeletons = page.getByTestId(
      "dac-card-description-loading"
    );

    this.searchInput = page.locator("#domain-search");
    this.continueButton = page.getByTestId("button-continue");
    this.loadMoreButton = page.getByRole("button", { name: /load more/i });
    this.cardAddToBasketButtons = this.cards.getByTestId(
      "button-add-to-basket"
    );
  }

  /** Locator for the nth card (0-indexed). */
  card(index: number): Locator {
    return this.cards.nth(index);
  }

  /** Add-to-basket button scoped to a single card (defaults to the first). */
  addToBasketButtonOnCard(index: number = 0): Locator {
    return this.card(index).getByTestId("button-add-to-basket");
  }

  /** Navigate to the standalone DAC page (`/domains/`) with a search query. */
  async gotoSearch(query: string) {
    await this.page.goto(
      `${URLs.domainSearch}?search=${encodeURIComponent(query)}`
    );
  }

  /** Type into the search field and submit, for flows that arrive without a `search` param. */
  async searchFor(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
  }

  /**
   * Wait for the card to render and its price-loading skeleton to clear,
   * then click Add to basket. Used by basket-add tests.
   */
  async clickAddOnCard(index: number = 0) {
    await expect(this.card(index)).toBeVisible();
    await expect(this.buttonLoadingSkeletons).toHaveCount(0);
    await this.addToBasketButtonOnCard(index).click();
  }

  async clickLoadMore() {
    await this.loadMoreButton.click();
  }
}
