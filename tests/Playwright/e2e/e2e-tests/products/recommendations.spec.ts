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
import {
  createOrder,
  addProductToOrder,
  getCurrentOrder
} from "../../support/api/index";

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
      test("Adding a recommendation with a single subPID option", async ({
        page,
        context
      }) => {
        await page.goto(URLs.rec1);
        await waitForSessionCookie(context);
        await productConfig.addToBasket.click();
        await page.waitForURL(/\/recommendations\/?$/);
        const card = page.getByTestId("carousel-card");
        await expect(card).toBeVisible();
        await card.getByTestId("button-add-to-basket").click();
        await page.waitForURL(/\/basket\/?$/);
        const token = await getSessionToken(context);
        const order = await getCurrentOrder(token);
        const orderProducts = order?.products;
        console.log(orderProducts);
        const subProdIds = collectSubproductIds(orderProducts[1]);
        expect(subProdIds).toEqual(expect.arrayContaining([SUB_PIDS.MAILBOX]));
      });
      test("Adding a recommendation with multiple suggested options", async ({
        page,
        context
      }) => {
        await page.goto(URLs.rec2);
        await waitForSessionCookie(context);
        await productConfig.addToBasket.click();
        await page.waitForURL(/\/recommendations\/?$/);
        const card = page.getByTestId("carousel-card");
        await expect(card).toBeVisible();
        await card.getByTestId("button-add-to-basket").click();
        await page.waitForURL(/\/basket\/?$/);
        const token = await getSessionToken(context);
        const order = await getCurrentOrder(token);
        const orderProducts = order?.products;
        console.log(orderProducts);
        const subProdIds = collectSubproductIds(orderProducts[1]);
        expect(subProdIds).toEqual(
          expect.arrayContaining([SUB_PIDS.TOKYO, SUB_PIDS.MAILBOX])
        );
      });
      test("Recommendations handles subpids in comma-separated strings", async ({
        page,
        context
      }) => {
        // The CSV branch in `normaliseSubPids` runs `compact(split(input, ","))`,
        // so trailing/leading commas and consecutive commas should be dropped
        // without throwing or polluting the basket POST.
        await page.goto(URLs.rec3);
        await waitForSessionCookie(context);
        await productConfig.addToBasket.click();
        await page.waitForURL(/\/recommendations\/?$/);
        const card = page.getByTestId("carousel-card");
        await expect(card).toBeVisible();
        await card.getByTestId("button-add-to-basket").click();
        await page.waitForURL(/\/basket\/?$/);
        const token = await getSessionToken(context);
        const order = await getCurrentOrder(token);
        const orderProducts = order?.products;
        console.log(orderProducts);
        const subProdIds = collectSubproductIds(orderProducts[1]);
        expect(subProdIds).toEqual(
          expect.arrayContaining([SUB_PIDS.TOKYO, SUB_PIDS.MAILBOX])
        );
        // No stray empty-string ids ended up in the POST.
        expect(subProdIds).not.toContain("");
      });
      test("Adding a recommendation with no preset options leaves it bare in the basket", async ({
        page,
        context
      }) => {
        await page.goto(URLs.rec4);
        await productConfig.addToBasket.click();
        await page.waitForURL(/\/recommendations\/?$/);
        const card = page.getByTestId("carousel-card");
        await expect(card).toBeVisible();
        await card.getByTestId("button-add-to-basket").click();
        await page.waitForURL(/\/basket\/?$/);
        const token = await getSessionToken(context);
        const order = await getCurrentOrder(token);
        const orderProducts = order?.products;
        console.log(orderProducts);
        const subProdIds = collectSubproductIds(orderProducts[1]);
        expect(subProdIds).not.toContain(SUB_PIDS.TOKYO);
        expect(subProdIds).not.toContain(SUB_PIDS.MAILBOX);
        expect(subProdIds).not.toContain(SUB_PIDS.OS);
      });
      test("Products already in the basket are not shown again as recommendations", async ({
        page,
        context
      }) => {
        await seedBasketProduct(context, products.STARTER_HOSTING);
        await page.goto(URLs.rec1);
        await productConfig.addToBasket.click();
        await page.waitForURL(/\/order\/basket\//);
        await expect(page.url()).not.toMatch(/\/recommendations\/?$/);
      });
      test("Customer cannot reach the recommendations step when there is nothing new to suggest", async ({
        page,
        context
      }) => {
        await seedBasketProduct(context, products.STARTER_HOSTING);
        await page.goto(`${URLs.baseUrl}order/recommendations/`);
        // The funnel rejects the recommendations route and forwards
        // through CHECKOUT_FLOW to BASKET
        await page.waitForURL(/\/order\/basket\//);
        await expect(page.url()).not.toMatch(/\/recommendations\/?$/);
      });

      test.describe("Visibility — conditions field", () => {
        test("Product match always overrides visibility 'default=true' setting", async ({
          page,
          context
        }) => {
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await page.goto(URLs.rec5);
          await productConfig.addToBasket.click();
          await page.waitForURL(/\/order\/basket\//);
          await expect(page.url()).not.toMatch(/\/recommendations\/?$/);
        });

        test("Recommendations skipped when 'hide' rule is triggered by a specific product in basket", async ({
          page,
          context
        }) => {
          await seedBasketProduct(context, products.FREE_HOSTING);
          await page.goto(URLs.rec6);
          await productConfig.addToBasket.click();
          await page.waitForURL(/\/order\/basket\//);
          await expect(page.url()).not.toMatch(/\/recommendations\/?$/);
        });

        test("Recommendations skipped when 'hide' rule is triggered by a product in basket with a specific billing term", async ({
          page,
          context
        }) => {
          await seedBasketProduct(context, products.FREE_HOSTING);
          await page.goto(URLs.rec7);
          await productConfig.addToBasket.click();
          await page.waitForURL(/\/order\/basket\//);
          await expect(page.url()).not.toMatch(/\/recommendations\/?$/);
        });

        test("Recommendations displayed when 'hide' rules do not apply", async ({
          page,
          context
        }) => {
          source.intercept(context, [
            {
              object_id: products.TSHIRT.id,
              conditions: hideWhenBasketProductBcmIs(1)
            }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await page.waitForURL(/\/recommendations\/?$/);
          await expect(
            recommendationCard(page, products.TSHIRT.name)
          ).toHaveCount(1);
        });

        test("A conditionally-shown recommendation stays hidden when its trigger never fires", async ({
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
          await page.waitForURL(/\/order\/basket\//);
          await expect(page.url()).not.toMatch(/\/recommendations\/?$/);
        });
      });

      test.describe("In-basket detection — inBasketConditions field", () => {
        test("A recommendation for a different product stays addable when something related is already in the basket", async ({
          page,
          context
        }) => {
          source.intercept(context, [
            { object_id: products.STARTER_HOSTING.id },
            { object_id: products.FREE_HOSTING.id }
          ]);
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await visitRecommendationsPage(page);
          await page.waitForURL(/\/recommendations\/?$/);

          const freeCard = recommendationCard(page, products.FREE_HOSTING.name);
          await expect(freeCard).toHaveCount(1);
          await expect(addToBasketButton(freeCard)).toBeEnabled();
        });

        test("A recommendation shows as already added when the customer has the matching variant", async ({
          page,
          context
        }) => {
          await seedBasketProduct(context, products.STARTER_HOSTING);
          await page.goto(URLs.rec8);
          await productConfig.addToBasket.click();
          await page.waitForURL(/\/recommendations\/?$/);
          const starterCard = recommendationCard(
            page,
            products.STARTER_HOSTING.name
          );
          await expect(addToBasketButton(starterCard)).toBeVisible();
          await expect(addToBasketButton(starterCard)).toBeDisabled();
        });

        test("A recommendation remains addable when the customer has a different variant of it", async ({
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
          await page.waitForURL(/\/recommendations\/?$/);

          const starterCard = recommendationCard(
            page,
            products.STARTER_HOSTING.name
          );
          await expect(addToBasketButton(starterCard)).toBeEnabled();
        });

        test("A recommendation stays addable when in-basket detection is turned off", async ({
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
          await page.waitForURL(/\/recommendations\/?$/);

          const starterCard = recommendationCard(
            page,
            products.STARTER_HOSTING.name
          );
          await expect(starterCard).toHaveCount(1);
          await expect(addToBasketButton(starterCard)).toBeEnabled();
        });

        test("A recommendation stays addable when nothing in the basket matches its in-basket rules", async ({
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
          await page.waitForURL(/\/recommendations\/?$/);

          const freeCard = recommendationCard(page, products.FREE_HOSTING.name);
          await expect(addToBasketButton(freeCard)).toBeEnabled();
        });
      });

      test.describe("Combined conditions and inBasketConditions", () => {
        test("A hidden recommendation never appears, even when it would have been marked as already added", async ({
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
          await page.waitForURL(/\/recommendations\/?$/);

          await expect(
            recommendationCard(page, products.STARTER_HOSTING.name)
          ).toHaveCount(0);
          await expect(
            recommendationCard(page, products.FREE_HOSTING.name)
          ).toHaveCount(1);
        });
      });
    });
  }
});
