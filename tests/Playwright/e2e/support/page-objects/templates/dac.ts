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

    this.loadMoreButton = page.getByTestId("button-load-more");
    this.cardAddToBasketButtons = this.cards.getByTestId("domain-card-cta");
  }

  /** Locator for the nth card (0-indexed). */
  card(index: number): Locator {
    return this.cards.nth(index);
  }

  /** Add-to-basket button scoped to a single card (defaults to the first). */
  addToBasketButtonOnCard(index: number = 0): Locator {
    return this.card(index).getByTestId("domain-card-cta");
  }

  /**
   * The card whose `domain-card-name` carries the given full domain in its
   * `data-test-value` (locale-stable). Lets assertions follow a specific row
   * by identity rather than position.
   */
  cardByDomain(domain: string): Locator {
    return this.cards.filter({
      has: this.page
        .getByTestId("domain-card-name")
        .and(this.page.locator(`[data-test-value="${domain}"]`))
    });
  }

  /** The full domain of a card, read from `domain-card-name`'s value. */
  async domainOfCard(card: Locator): Promise<string | null> {
    return card.getByTestId("domain-card-name").getAttribute("data-test-value");
  }

  /**
   * Adds the first genuinely-addable domain to the basket and returns the
   * domain that landed.
   *
   * A CTA showing `register` is only provisionally addable: the `/suggestions`
   * list can offer a domain that is actually registered on staging, and the
   * click-time `/availability` pre-check then rejects it — leaving the row at
   * `register` without committing. Worse, a rejected click poisons the DAC
   * machine so the next add only updates the row optimistically without
   * POSTing. So each attempt re-navigates to get a clean machine, targets the
   * Nth `register` row, clicks it once, and accepts it only if that row reaches
   * the in-basket `added` state — the real commit signal (the optimistic add
   * and the `/products` POST share the row, so on a clean machine `added`
   * means the basket POST fired). The first row that commits wins, keeping the
   * caller independent of which specific TLD staging has free.
   */
  async addFirstAvailableDomain(
    query: string,
    maxAttempts = 5
  ): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) await this.gotoSearch(query);
      await expect(this.firstCard).toBeVisible();
      await expect(this.buttonLoadingSkeletons).toHaveCount(0);

      const registerNames = this.cards
        .filter({
          has: this.page
            .getByTestId("domain-card-cta")
            .and(this.page.locator('[data-test-value="register"]'))
        })
        .getByTestId("domain-card-name");
      if (attempt >= (await registerNames.count())) break;

      const domain = await registerNames
        .nth(attempt)
        .getAttribute("data-test-value");
      if (!domain) continue;

      // Resolve the CTA by domain identity so the click targets the right
      // row even when the results re-sort after the add.
      const cta = this.cardByDomain(domain).getByTestId("domain-card-cta");
      await cta.click();

      // Confirm the commit against the LIVE BASKET, not the card CTA. Now
      // that `.com` (and the other suggested TLDs) add cleanly on staging,
      // the click fires a real /products POST — but the smart-suggest list
      // re-sorts and re-checks availability on add, so the tracked CTA can
      // sit at `register`/disabled longer than a tight window even though the
      // domain already landed. The basket is the source of truth (mirrors
      // addExactDomain), so poll it for the committed domain instead.
      const sld = domain.split(".")[0].toLowerCase();
      const committed = await expect
        .poll(
          () =>
            this.page.evaluate(
              needle =>
                JSON.stringify(window.Upmind?.useBasket().products.value ?? [])
                  .toLowerCase()
                  .includes(needle),
              sld
            ),
          { timeout: 14000 }
        )
        .toBe(true)
        .then(() => true)
        .catch(() => false);

      if (committed) return domain;
    }

    throw new Error("No registerable domain could be added to the basket");
  }

  /**
   * Adds a single EXACT domain (a full name like `foo.co.uk`) to the basket by
   * identity, and confirms the in-basket commit.
   *
   * Unlike `addFirstAvailableDomain`, this does NOT iterate the suggestion list
   * — it targets the exact-match card for `domain`, so it can't drift onto a
   * `.com` suggestion (whose staging product currently carries a required
   * multi-choice option that blocks a one-click Add — tracked separately).
   * Searching a full domain can auto-commit the exact match, so the card may
   * already be `added`; otherwise it's `register` and we click it.
   */
  async addExactDomain(domain: string): Promise<void> {
    const cta = this.cardByDomain(domain).getByTestId("domain-card-cta");
    await expect(this.firstCard).toBeVisible();
    await expect(this.buttonLoadingSkeletons).toHaveCount(0);

    // Click only once the exact-match card's Add button is genuinely enabled —
    // clicking while it's still resolving availability triggers a rejected add.
    await expect(cta).toBeEnabled({ timeout: 20000 });
    await cta.click();

    // Confirm against the LIVE BASKET (the source of truth), not the card CTA:
    // the CTA lags and the results re-sort after an add, so watching it is
    // unreliable. The basket is what actually proves the domain was added.
    const sld = domain.split(".")[0].toLowerCase();
    await expect
      .poll(
        () =>
          this.page.evaluate(
            needle =>
              JSON.stringify(window.Upmind?.useBasket().products.value ?? [])
                .toLowerCase()
                .includes(needle),
            sld
          ),
        { timeout: 15000 }
      )
      .toBe(true);
  }

  /** Navigate to the standalone DAC page (`/domains/`) with a search query. */
  async gotoSearch(query: string) {
    await this.page.goto(
      `${URLs.domainSearch}?search=${encodeURIComponent(query)}`
    );
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
