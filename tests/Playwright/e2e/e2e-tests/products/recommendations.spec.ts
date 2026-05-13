import {
  test,
  expect,
  BrowserContext,
  Locator,
  Page,
  Request
} from "@playwright/test";
import { URLs, ProductIds } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import {
  interceptProductsToRecommend,
  interceptRelatedProducts,
  type RecommendationConfig
} from "../../support/mocks";
import { waitForSessionCookie } from "../../support/helpers/session";
import { getSessionToken } from "../../support/api/auth";
import { createOrder, addProductToOrder } from "../../support/api/basket";

/**
 * The backend may return `config.sub_pids` on a recommendation as an
 * array, a single string, or a comma-separated string. `normaliseSubPids`
 * in `packages/headless/src/modules/product/utils.ts` collapses all three
 * into a string array, which `parseProductProps` then resolves into the
 * structured `options` / `attributes` shape the basket POST expects.
 *
 * Recommendations reach the carousel from two sources that both feed
 * `parseProductsToRecommend` in
 * `packages/headless/src/modules/recommendations/utils.ts`:
 *  - `meta["@data.productsToRecommend"]` — config-driven recommendations
 *  - `product.related[]` — native (backend-declared) recommendations
 *
 * These tests inject a synthetic recommendation pointing at
 * `STARTER_HOSTING` (which has well-known subproducts under
 * `ProductIds.subproduct*`) onto each source in turn, then verify the
 * resulting POST body contains the right subproduct ids regardless of
 * the input format. Parameterising over both sources guarantees neither
 * code path silently regresses.
 */

const SUB_PIDS = {
  TOKYO: ProductIds.subproductTokyo,
  MAILBOX: ProductIds.subproductMailbox,
  OS: ProductIds.subproductOperatingSystem
} as const;

let productConfig: ProductConfig;

/**
 * Seeds the basket and lands on the recommendations carousel.
 *
 * The basket starts at `URLs.recommendations1` (a product known to route
 * to the recommendations page after "Add to basket"). Once the URL
 * contains `/recommendations/`, the intercepted `related[]` array drives
 * what cards are shown.
 */
async function navigateToRecommendations(page: Page, context: BrowserContext) {
  await page.goto(URLs.recommendations1);
  await waitForSessionCookie(context);
  await productConfig.addToBasket.click();
  await page.waitForURL(/\/recommendations\/?$/);
}

/**
 * Waits for the POST that adds the recommended product to the basket
 * and returns the parsed JSON body.
 */
async function captureAddProductRequest(
  page: Page,
  recommendedProductId: string
): Promise<Record<string, any>> {
  const request: Request = await page.waitForRequest(req => {
    if (
      req.method() !== "POST" ||
      !/\/api\/orders\/[^/]+\/products(?:\?|$)/.test(req.url())
    ) {
      return false;
    }
    try {
      const body = JSON.parse(req.postData() ?? "{}");
      return body?.product_id === recommendedProductId;
    } catch {
      return false;
    }
  });
  return JSON.parse(request.postData() ?? "{}");
}

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
 * Pre-seeds the current session's basket with `product` via the API.
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
  context: BrowserContext,
  product: { id: string; billingCycle: number; type: string }
): Promise<void> {
  const token = await getSessionToken(context);
  const order = await createOrder(token);
  const provisionFields =
    product.type === "domain" || product.type === "hosting"
      ? { domain: `pw-${Date.now().toString(36)}.com` }
      : {};
  await addProductToOrder(
    token,
    order.id,
    product.id,
    1,
    product.billingCycle,
    [],
    [],
    provisionFields,
    [],
    true,
    false
  );
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

function recommendationCard(page: Page, name: string): Locator {
  return page.getByTestId("carousel-card").filter({ hasText: name });
}

function addToBasketButton(card: Locator): Locator {
  return card.getByRole("button", { name: /add to basket/i });
}

function inBasketButton(card: Locator): Locator {
  return card.getByRole("button", { name: /in basket/i });
}

async function visitRecommendationsPage(page: Page): Promise<void> {
  await page.goto(`${URLs.baseUrl}order/recommendations/`);
}

async function expectRecommendationsPageLoaded(page: Page): Promise<void> {
  await page.waitForURL(/\/recommendations\/?$/);
}

async function expectRedirectAwayFromRecommendations(
  page: Page
): Promise<void> {
  await page.waitForURL(/\/order\/basket\//);
  expect(page.url()).not.toMatch(/\/recommendations\/?$/);
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
  intercept: (
    context: BrowserContext,
    recommendations: RecommendationConfig[]
  ) => void;
}> = [
  { name: "productsToRecommend", intercept: interceptProductsToRecommend },
  { name: "related", intercept: interceptRelatedProducts }
];

test.describe("Recommendations", () => {
  test.beforeEach(async ({ page, context }) => {
    productConfig = new ProductConfig(page);
    await page.goto("/");
    await waitForSessionCookie(context);
  });

  for (const source of SOURCES) {
    test.describe(`${source.name}`, () => {
      test("Array `sub_pids` pre-selects every listed subproduct", async ({
        page,
        context
      }) => {
        source.intercept(context, [
          {
            object_id: products.STARTER_HOSTING.id,
            config: { sub_pids: [SUB_PIDS.TOKYO, SUB_PIDS.MAILBOX] }
          }
        ]);
        await navigateToRecommendations(page, context);
        const card = page.getByTestId("carousel-card").first();
        await expect(card).toBeVisible();
        const requestPromise = captureAddProductRequest(
          page,
          products.STARTER_HOSTING.id
        );
        await card.getByTestId("button-add-to-basket").click();
        const body = await requestPromise;
        const ids = collectSubproductIds(body);
        expect(ids).toEqual(
          expect.arrayContaining([SUB_PIDS.TOKYO, SUB_PIDS.MAILBOX])
        );
      });
      test("Single-string `sub_pids` pre-selects that one subproduct", async ({
        page,
        context
      }) => {
        source.intercept(context, [
          {
            object_id: products.STARTER_HOSTING.id,
            config: { sub_pids: SUB_PIDS.TOKYO }
          }
        ]);
        await navigateToRecommendations(page, context);
        const card = page.getByTestId("carousel-card").first();
        await expect(card).toBeVisible();
        const requestPromise = captureAddProductRequest(
          page,
          products.STARTER_HOSTING.id
        );
        await card.getByTestId("button-add-to-basket").click();
        const body = await requestPromise;
        const ids = collectSubproductIds(body);
        expect(ids).toContain(SUB_PIDS.TOKYO);
        expect(ids).not.toContain(SUB_PIDS.MAILBOX);
      });
      test("CSV `sub_pids` pre-selects every comma-separated subproduct", async ({
        page,
        context
      }) => {
        source.intercept(context, [
          {
            object_id: products.STARTER_HOSTING.id,
            config: {
              sub_pids: `${SUB_PIDS.TOKYO},${SUB_PIDS.MAILBOX},${SUB_PIDS.OS}`
            }
          }
        ]);
        await navigateToRecommendations(page, context);
        const card = page.getByTestId("carousel-card").first();
        await expect(card).toBeVisible();
        const requestPromise = captureAddProductRequest(
          page,
          products.STARTER_HOSTING.id
        );
        await card.getByTestId("button-add-to-basket").click();
        const body = await requestPromise;
        const ids = collectSubproductIds(body);
        expect(ids).toEqual(
          expect.arrayContaining([
            SUB_PIDS.TOKYO,
            SUB_PIDS.MAILBOX,
            SUB_PIDS.OS
          ])
        );
      });
      test("CSV with empty tokens is tolerated and resolves the valid ones", async ({
        page,
        context
      }) => {
        // The CSV branch in `normaliseSubPids` runs `compact(split(input, ","))`,
        // so trailing/leading commas and consecutive commas should be dropped
        // without throwing or polluting the basket POST.
        source.intercept(context, [
          {
            object_id: products.STARTER_HOSTING.id,
            config: { sub_pids: `,${SUB_PIDS.TOKYO},,${SUB_PIDS.MAILBOX},` }
          }
        ]);
        await navigateToRecommendations(page, context);
        const card = page.getByTestId("carousel-card").first();
        await expect(card).toBeVisible();
        const requestPromise = captureAddProductRequest(
          page,
          products.STARTER_HOSTING.id
        );
        await card.getByTestId("button-add-to-basket").click();
        const body = await requestPromise;
        const ids = collectSubproductIds(body);
        expect(ids).toEqual(
          expect.arrayContaining([SUB_PIDS.TOKYO, SUB_PIDS.MAILBOX])
        );
        // No stray empty-string ids ended up in the POST.
        expect(ids).not.toContain("");
      });
      test("Missing `sub_pids` adds the recommendation with no subproduct selection", async ({
        page,
        context
      }) => {
        source.intercept(context, [{ object_id: products.STARTER_HOSTING.id }]);
        await navigateToRecommendations(page, context);
        const card = page.getByTestId("carousel-card").first();
        await expect(card).toBeVisible();
        const requestPromise = captureAddProductRequest(
          page,
          products.STARTER_HOSTING.id
        );
        await card.getByTestId("button-add-to-basket").click();
        const body = await requestPromise;
        const ids = collectSubproductIds(body);
        expect(ids).not.toContain(SUB_PIDS.TOKYO);
        expect(ids).not.toContain(SUB_PIDS.MAILBOX);
        expect(ids).not.toContain(SUB_PIDS.OS);
      });
      test("Recommendations matching an existing basket product are filtered from the carousel", async ({
        page,
        context
      }) => {
        source.intercept(context, [
          { object_id: products.STARTER_HOSTING.id },
          { object_id: products.FREE_HOSTING.id }
        ]);
        await seedBasketProduct(context, products.STARTER_HOSTING);
        await page.goto(`${URLs.baseUrl}order/recommendations/`);
        await page.waitForURL(/\/recommendations\/?$/);
        await expect(page.getByTestId("carousel-card")).toHaveCount(1);
        await expect(page.getByTestId("carousel-card").first()).toContainText(
          products.FREE_HOSTING.name
        );
      });
      test("Skips the recommendations page when the only recommendation is already in the basket", async ({
        page,
        context
      }) => {
        source.intercept(context, [{ object_id: products.STARTER_HOSTING.id }]);
        await seedBasketProduct(context, products.STARTER_HOSTING);
        await page.goto(`${URLs.baseUrl}order/recommendations/`);
        // The funnel rejects the recommendations route and forwards
        // through CHECKOUT_FLOW to BASKET — never lingering on
        // /recommendations/.
        await page.waitForURL(/\/order\/basket\//);
        expect(page.url()).not.toMatch(/\/recommendations\/?$/);
      });

      test.describe("Visibility — conditions field", () => {
        test("Recommendation without `conditions` renders unconditionally", async ({
          page,
          context
        }) => {
          source.intercept(context, [{ object_id: products.FREE_HOSTING.id }]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expectRecommendationsPageLoaded(page);

          await expect(
            recommendationCard(page, products.FREE_HOSTING.name)
          ).toHaveCount(1);
        });

        test("`basket.pids.$contains` hides the recommendation when that product is in the basket", async ({
          page,
          context
        }) => {
          source.intercept(context, [
            {
              object_id: products.FREE_HOSTING.id,
              conditions: hideWhenBasketContains(products.STARTER_HOSTING.id)
            }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);

          await expectRedirectAwayFromRecommendations(page);
        });

        test("`basketProduct.bcm` hides the recommendation when its own variant is in the basket", async ({
          page,
          context
        }) => {
          source.intercept(context, [
            {
              object_id: products.STARTER_HOSTING.id,
              conditions: hideWhenBasketProductBcmIs(
                products.STARTER_HOSTING.billingCycle
              )
            },
            { object_id: products.FREE_HOSTING.id }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expectRecommendationsPageLoaded(page);

          await expect(
            recommendationCard(page, products.STARTER_HOSTING.name)
          ).toHaveCount(0);
          await expect(
            recommendationCard(page, products.FREE_HOSTING.name)
          ).toHaveCount(1);
        });

        test("`basketProduct.*` rule with no matching basket product falls back to `default`", async ({
          page,
          context
        }) => {
          source.intercept(context, [
            {
              object_id: products.FREE_HOSTING.id,
              conditions: hideWhenBasketProductBcmIs(1)
            }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expectRecommendationsPageLoaded(page);

          await expect(
            recommendationCard(page, products.FREE_HOSTING.name)
          ).toHaveCount(1);
        });

        test('`default: "hidden"` keeps the recommendation hidden when no rule fires', async ({
          page,
          context
        }) => {
          source.intercept(context, [
            {
              object_id: products.FREE_HOSTING.id,
              conditions: showOnlyWhenBasketContains(products.DOMAIN.id)
            }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);

          await expectRedirectAwayFromRecommendations(page);
        });
      });

      test.describe("In-basket detection — inBasketConditions field", () => {
        test("Recommendation without `inBasketConditions` falls back to loose `product_id` match", async ({
          page,
          context
        }) => {
          source.intercept(context, [
            { object_id: products.STARTER_HOSTING.id },
            { object_id: products.FREE_HOSTING.id }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expectRecommendationsPageLoaded(page);

          const freeCard = recommendationCard(page, products.FREE_HOSTING.name);
          await expect(freeCard).toHaveCount(1);
          await expect(addToBasketButton(freeCard)).toBeEnabled();
        });

        test("`inBasketConditions` marks the recommendation as in basket when the variant rule fires", async ({
          page,
          context
        }) => {
          source.intercept(context, [
            {
              object_id: products.STARTER_HOSTING.id,
              inBasketConditions: markAddedWhenBasketProductBcmIs(
                products.STARTER_HOSTING.billingCycle
              )
            },
            { object_id: products.FREE_HOSTING.id }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expectRecommendationsPageLoaded(page);

          const starterCard = recommendationCard(
            page,
            products.STARTER_HOSTING.name
          );
          await expect(inBasketButton(starterCard)).toBeVisible();
          await expect(inBasketButton(starterCard)).toBeDisabled();
        });

        test("`inBasketConditions` leaves the recommendation interactive when the variant rule doesn't fire", async ({
          page,
          context
        }) => {
          const nonMatchingBcm = 12;
          source.intercept(context, [
            {
              object_id: products.STARTER_HOSTING.id,
              inBasketConditions:
                markAddedWhenBasketProductBcmIs(nonMatchingBcm)
            }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expectRecommendationsPageLoaded(page);

          const starterCard = recommendationCard(
            page,
            products.STARTER_HOSTING.name
          );
          await expect(addToBasketButton(starterCard)).toBeEnabled();
        });

        test("`{ default: false, rules: [] }` disables in-basket detection entirely", async ({
          page,
          context
        }) => {
          source.intercept(context, [
            {
              object_id: products.STARTER_HOSTING.id,
              inBasketConditions: inBasketDetectionDisabled
            }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expectRecommendationsPageLoaded(page);

          const starterCard = recommendationCard(
            page,
            products.STARTER_HOSTING.name
          );
          await expect(starterCard).toHaveCount(1);
          await expect(addToBasketButton(starterCard)).toBeEnabled();
        });

        test("`inBasketConditions` falls back to `default` when no basket product matches `object_id`", async ({
          page,
          context
        }) => {
          source.intercept(context, [
            {
              object_id: products.FREE_HOSTING.id,
              inBasketConditions: markAddedWhenBasketProductBcmIs(1)
            }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expectRecommendationsPageLoaded(page);

          const freeCard = recommendationCard(page, products.FREE_HOSTING.name);
          await expect(addToBasketButton(freeCard)).toBeEnabled();
        });
      });

      test.describe("Combined conditions and inBasketConditions", () => {
        test("`conditions: hidden` wins over `inBasketConditions: true` because hidden cards never reach the carousel", async ({
          page,
          context
        }) => {
          source.intercept(context, [
            {
              object_id: products.STARTER_HOSTING.id,
              conditions: hideWhenBasketContains(products.STARTER_HOSTING.id),
              inBasketConditions: markAddedWhenBasketProductBcmIs(
                products.STARTER_HOSTING.billingCycle
              )
            },
            { object_id: products.FREE_HOSTING.id }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expectRecommendationsPageLoaded(page);

          await expect(
            recommendationCard(page, products.STARTER_HOSTING.name)
          ).toHaveCount(0);
          await expect(
            recommendationCard(page, products.FREE_HOSTING.name)
          ).toHaveCount(1);
        });

        test("Visible `conditions` and firing `inBasketConditions` renders the recommendation as already in basket", async ({
          page,
          context
        }) => {
          const productNotInBasket = products.DOMAIN.id;
          source.intercept(context, [
            {
              object_id: products.STARTER_HOSTING.id,
              conditions: hideWhenBasketContains(productNotInBasket),
              inBasketConditions: markAddedWhenBasketProductBcmIs(
                products.STARTER_HOSTING.billingCycle
              )
            }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await expectRecommendationsPageLoaded(page);

          const starterCard = recommendationCard(
            page,
            products.STARTER_HOSTING.name
          );
          await expect(starterCard).toHaveCount(1);
          await expect(inBasketButton(starterCard)).toBeDisabled();
        });
      });
    });
  }
});
