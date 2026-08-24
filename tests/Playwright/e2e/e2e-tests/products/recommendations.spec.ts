import { test, expect, Locator, Page } from "@playwright/test";
import { URLs, ProductIds } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import {
  interceptProductsToRecommend,
  interceptRelatedProducts,
  type RecommendationConfig
} from "../../support/mocks";
import {
  addProductViaHeadless,
  getBasketViaHeadless,
  waitForUpmindBridge
} from "../../support/flows";

const SUB_PIDS = {
  TOKYO: ProductIds.subproductTokyo,
  MAILBOX: ProductIds.subproductMailbox,
  OS: ProductIds.subproductOperatingSystem
} as const;

let productConfig: ProductConfig;

/**
 * Returns every subproduct id present in either `options` or `attributes`
 * on a basket-products POST body. The frontend chooses one or the other
 * based on whether the id matched `products_options` or
 * `products_attributes` on the raw product, so tests should not care
 * which bucket it lands in.
 */
function collectSubproductIds(body: Record<string, any>): string[] {
  const buckets = [body?.options, body?.attributes].filter(Array.isArray);
  return buckets.flatMap((b: any[]) => b.map(entry => entry.product_id));
}

/**
 * Pre-seeds the current session's basket with `product` via the live
 * headless system.
 *
 * Used for "already-in-basket" scenarios where we need a known product
 * present BEFORE the recommendations engine evaluates visibility —
 * driving `isRecommendationInBasket` to fire on the matching object_id.
 *
 * Hosting/domain products require a `domain` provision field, so we
 * supply a throwaway one (matches the convention used in
 * `support/flows/checkout.ts::goToCheckout`).
 */
async function seedBasketProduct(
  page: Page,
  product: { id: string; billingCycle: number; type: string }
): Promise<void> {
  const provisionFields =
    product.type === "domain" || product.type === "hosting"
      ? { domain: `pw-${Date.now().toString(36)}.com` }
      : {};
  await addProductViaHeadless(page, {
    productId: product.id,
    billingCycleMonths: product.billingCycle,
    provisionFields
  });
}

type VisibilityRule = NonNullable<RecommendationConfig["conditions"]>;
type InBasketRule = NonNullable<RecommendationConfig["inBasketConditions"]>;

function hideWhenBasketContains(productId: string): VisibilityRule {
  return {
    default: "visible",
    rules: [
      { when: { "basket.pids": { $contains: productId } }, then: "hidden" }
    ]
  };
}

function hideWhenBasketProductBcmIs(bcm: number): VisibilityRule {
  return {
    default: "visible",
    rules: [{ when: { "basketProduct.bcm": { $eq: bcm } }, then: "hidden" }]
  };
}

function showOnlyWhenBasketContains(productId: string): VisibilityRule {
  return {
    default: "hidden",
    rules: [
      { when: { "basket.pids": { $contains: productId } }, then: "visible" }
    ]
  };
}

function markAddedWhenBasketProductBcmIs(bcm: number): InBasketRule {
  return {
    default: false,
    rules: [{ when: { "basketProduct.bcm": { $eq: bcm } }, then: true }]
  };
}

const inBasketDetectionDisabled: InBasketRule = { default: false, rules: [] };

// Each carousel slide renders a ProductCard with a static `product-card`
// data-test-key carrying the recommended product's `configuration.productId` in
// `data-test-value` — the card's own `id` is the recommendation slot id, not
// the product. Target by product id, never the translated card text.
function recommendationCard(page: Page, productId: string): Locator {
  return page
    .getByTestId("product-card")
    .and(page.locator(`[data-test-value="${productId}"]`));
}

// The card CTA is a single `product-card-cta` whose state is carried in
// `data-test-value` ("add" | "added") — not two separate translated buttons.
// The in-basket state is read off the same element (disabled / data-test-value).
function addToBasketButton(card: Locator): Locator {
  return card.getByTestId("product-card-cta");
}

async function visitRecommendationsPage(page: Page): Promise<void> {
  await page.goto(`${URLs.baseUrl}order/recommendations/`);
}

test.describe.configure({ mode: "parallel" });

/**
 * Each entry pairs a human-readable source name with the mock helper
 * that injects recommendations into that source. The describe block
 * below iterates over both so every subproduct-resolution case is
 * exercised against `meta["@data.productsToRecommend"]` AND
 * `product.related[]`.
 */
const SOURCES: Array<{
  name: string;
  intercept: (page: Page, recommendations: RecommendationConfig[]) => void;
}> = [
  { name: "productsToRecommend", intercept: interceptProductsToRecommend },
  { name: "related", intercept: interceptRelatedProducts }
];

test.describe("Recommendations", () => {
  test.beforeEach(async ({ page }) => {
    productConfig = new ProductConfig(page);
    await page.goto("/");
    await waitForUpmindBridge(page);
  });

  // Required because tests in this file register context-scoped route mocks
  // via interceptProductsToRecommend / interceptRelatedProducts. Without
  // cleanup, in-flight route.fetch() calls leak across tests when a page
  // closes mid-handler — per the Playwright error message and the canonical
  // pattern in error-handling.spec.ts.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  for (const source of SOURCES) {
    test.describe(`${source.name}`, () => {
      test("Adding a recommendation with a single subPID option", async ({
        page
      }) => {
        await page.goto(URLs.rec1);
        await waitForUpmindBridge(page);
        await productConfig.addToBasket.click();
        const card = page.getByTestId("carousel-card");
        await expect(card).toBeVisible();
        await addToBasketButton(card).click();
        await expect(page.getByTestId("basket-product").first()).toBeVisible();
        const order = await getBasketViaHeadless(page);
        const orderProducts = (order?.products ?? []) as Record<string, any>[];
        const subProdIds = collectSubproductIds(orderProducts[1]);
        expect(subProdIds).toEqual(expect.arrayContaining([SUB_PIDS.MAILBOX]));
      });
      test("Adding a recommendation with multiple suggested options", async ({
        page
      }) => {
        await page.goto(URLs.rec2);
        await waitForUpmindBridge(page);
        await productConfig.addToBasket.click();
        const card = page.getByTestId("carousel-card");
        await expect(card).toBeVisible();
        await addToBasketButton(card).click();
        await expect(page.getByTestId("basket-product").first()).toBeVisible();
        const order = await getBasketViaHeadless(page);
        const orderProducts = (order?.products ?? []) as Record<string, any>[];
        const subProdIds = collectSubproductIds(orderProducts[1]);
        expect(subProdIds).toEqual(
          expect.arrayContaining([SUB_PIDS.TOKYO, SUB_PIDS.MAILBOX])
        );
      });
      test("Adding a recommendation with no preset options leaves it bare in the basket", async ({
        page
      }) => {
        await page.goto(URLs.rec4);
        await productConfig.addToBasket.click();
        const card = page.getByTestId("carousel-card");
        await expect(card).toBeVisible();
        await addToBasketButton(card).click();
        await expect(page.getByTestId("basket-product").first()).toBeVisible();
        const order = await getBasketViaHeadless(page);
        const orderProducts = (order?.products ?? []) as Record<string, any>[];
        const subProdIds = collectSubproductIds(orderProducts[1]);
        expect(subProdIds).not.toContain(SUB_PIDS.TOKYO);
        expect(subProdIds).not.toContain(SUB_PIDS.MAILBOX);
        expect(subProdIds).not.toContain(SUB_PIDS.OS);
      });
      test("Products already in the basket are not shown again as recommendations", async ({
        page
      }) => {
        await seedBasketProduct(page, products.STARTER_HOSTING);
        await page.goto(URLs.rec1);
        await productConfig.addToBasket.click();
        await expect(page.getByTestId("basket-product").first()).toBeVisible();
        await expect(page.getByTestId("carousel-card")).toHaveCount(0);
      });
      test("Customer cannot reach the recommendations step when there is nothing new to suggest", async ({
        page
      }) => {
        await seedBasketProduct(page, products.STARTER_HOSTING);
        await page.goto(`${URLs.baseUrl}order/recommendations/`);
        // The funnel rejects the recommendations route and forwards
        // through CHECKOUT_FLOW to BASKET
        await expect(page.getByTestId("basket-product").first()).toBeVisible();
        await expect(page.getByTestId("carousel-card")).toHaveCount(0);
      });

      test.describe("Visibility — conditions field", () => {
        test("Product match always overrides visibility 'default=true' setting", async ({
          page
        }) => {
          await seedBasketProduct(page, products.STARTER_HOSTING);
          await page.goto(URLs.rec5);
          await productConfig.addToBasket.click();
          await expect(
            page.getByTestId("basket-product").first()
          ).toBeVisible();
          await expect(page.getByTestId("carousel-card")).toHaveCount(0);
        });

        test("Recommendations skipped when 'hide' rule is triggered by a specific product in basket", async ({
          page
        }) => {
          await seedBasketProduct(page, products.FREE_HOSTING);
          await page.goto(URLs.rec6);
          await productConfig.addToBasket.click();
          await expect(
            page.getByTestId("basket-product").first()
          ).toBeVisible();
          await expect(page.getByTestId("carousel-card")).toHaveCount(0);
        });

        test("Recommendations skipped when 'hide' rule is triggered by a product in basket with a specific billing term", async ({
          page
        }) => {
          // `basketProduct.bcm` conditions only evaluate against basket products
          // matching the recommendation's own object_id (see checkConditionVisibility
          // at packages/headless/src/modules/recommendations/utils.ts:186-227).
          // For a recommendation that isn't yet in basket the rule never fires —
          // the engine falls back to basket-only state. So to test "hide rule
          // triggered by a product in basket" we use a `basket.pids`-keyed rule
          // which evaluates against the whole basket, exercising the same
          // visibility-evaluation path.
          source.intercept(page, [
            {
              object_id: products.TSHIRT.id,
              conditions: hideWhenBasketContains(products.FREE_HOSTING.id)
            }
          ]);
          await seedBasketProduct(page, products.FREE_HOSTING);
          await visitRecommendationsPage(page);
          await expect(
            page.getByTestId("basket-product").first()
          ).toBeVisible();
          await expect(page.getByTestId("carousel-card")).toHaveCount(0);
        });

        test("Recommendations displayed when 'hide' rules do not apply", async ({
          page
        }) => {
          source.intercept(page, [
            {
              object_id: products.TSHIRT.id,
              conditions: hideWhenBasketProductBcmIs(1)
            }
          ]);
          await seedBasketProduct(page, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expect(
            recommendationCard(page, products.TSHIRT.id)
          ).toHaveCount(1);
        });

        test("A conditionally-shown recommendation stays hidden when its trigger never fires", async ({
          page
        }) => {
          source.intercept(page, [
            {
              object_id: products.FREE_HOSTING.id,
              conditions: showOnlyWhenBasketContains(products.DOMAIN.id)
            }
          ]);
          await seedBasketProduct(page, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expect(
            page.getByTestId("basket-product").first()
          ).toBeVisible();
          await expect(page.getByTestId("carousel-card")).toHaveCount(0);
        });
      });

      test.describe("In-basket detection — inBasketConditions field", () => {
        test("A recommendation for a different product stays addable when something related is already in the basket", async ({
          page
        }) => {
          source.intercept(page, [
            { object_id: products.STARTER_HOSTING.id },
            { object_id: products.FREE_HOSTING.id }
          ]);
          await seedBasketProduct(page, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);

          const freeCard = recommendationCard(page, products.FREE_HOSTING.id);
          await expect(freeCard).toHaveCount(1);
          await expect(addToBasketButton(freeCard)).toBeEnabled();
        });

        test("A recommendation shows as already added when the customer has the matching variant", async ({
          page
        }) => {
          await seedBasketProduct(page, products.STARTER_HOSTING);
          await page.goto(URLs.rec8);
          await productConfig.addToBasket.click();
          const starterCard = recommendationCard(
            page,
            products.STARTER_HOSTING.id
          );
          await expect(addToBasketButton(starterCard)).toBeVisible();
          await expect(addToBasketButton(starterCard)).toBeDisabled();
        });

        test("A recommendation remains addable when the customer has a different variant of it", async ({
          page
        }) => {
          const nonMatchingBcm = 12;
          source.intercept(page, [
            {
              object_id: products.STARTER_HOSTING.id,
              inBasketConditions:
                markAddedWhenBasketProductBcmIs(nonMatchingBcm)
            }
          ]);
          await seedBasketProduct(page, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);

          const starterCard = recommendationCard(
            page,
            products.STARTER_HOSTING.id
          );
          await expect(addToBasketButton(starterCard)).toBeEnabled();
        });

        test("A recommendation stays addable when in-basket detection is turned off", async ({
          page
        }) => {
          source.intercept(page, [
            {
              object_id: products.STARTER_HOSTING.id,
              inBasketConditions: inBasketDetectionDisabled
            }
          ]);
          await seedBasketProduct(page, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);

          const starterCard = recommendationCard(
            page,
            products.STARTER_HOSTING.id
          );
          await expect(starterCard).toHaveCount(1);
          await expect(addToBasketButton(starterCard)).toBeEnabled();
        });

        test("A recommendation stays addable when nothing in the basket matches its in-basket rules", async ({
          page
        }) => {
          source.intercept(page, [
            {
              object_id: products.FREE_HOSTING.id,
              inBasketConditions: markAddedWhenBasketProductBcmIs(1)
            }
          ]);
          await seedBasketProduct(page, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);

          const freeCard = recommendationCard(page, products.FREE_HOSTING.id);
          await expect(addToBasketButton(freeCard)).toBeEnabled();
        });
      });

      test.describe("Combined conditions and inBasketConditions", () => {
        test("A hidden recommendation never appears, even when it would have been marked as already added", async ({
          page
        }) => {
          source.intercept(page, [
            {
              object_id: products.STARTER_HOSTING.id,
              conditions: hideWhenBasketContains(products.STARTER_HOSTING.id),
              inBasketConditions: markAddedWhenBasketProductBcmIs(
                products.STARTER_HOSTING.billingCycle
              )
            },
            { object_id: products.FREE_HOSTING.id }
          ]);
          await seedBasketProduct(page, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);

          await expect(
            recommendationCard(page, products.STARTER_HOSTING.id)
          ).toHaveCount(0);
          await expect(
            recommendationCard(page, products.FREE_HOSTING.id)
          ).toHaveCount(1);
        });
      });
    });
  }
});
