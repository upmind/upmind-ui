import { expect, Page } from "@playwright/test";
import { newUser } from "../../support/fixtures";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { gateways } from "../../support/constants/gateways";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { applySchemaDefaults } from "../../support/flows";
import { captureProduct } from "../../support/mocks/products";

// A "generic" product type — neither domain nor hosting. The T-Shirt is a
// configurable apparel product ("Has options or attributes — must navigate to
// configure"), so its required option/attribute categories exercise the same
// `applySchemaDefaults` rail the domain and hosting journeys use, proving the
// helper is product-type agnostic (FE-2781 AC: domain, hosting, generic).
const GENERIC_PRODUCT_URL = `${URLs.baseUrl}order/product/${products.TSHIRT.id}/`;

let productConfig: ProductConfig;
let checkout: Checkout;
let basket: Basket;

// The journey below completes via a BANK_TRANSFER (manual) placement. FE-2985
// payload guards do NOT apply here: headless mapPaymentData returns undefined for
// BANK_TRANSFER, so no /api/payments request fires — the order is placed via
// PATCH /orders/{id}/convert with an EMPTY payment body, and no gateway_id/amount
// reaches the wire (both resolved server-side / fixed on the invoice). This spec
// proves the buying JOURNEY end-to-end and asserts the end-state confirmation;
// placement-payload coverage lives in the Stripe checkout-paths and
// existing-method specs.
newUser.describe("Generic product customers", () => {
  newUser.describe.configure({ mode: "serial" });
  newUser.beforeEach(async ({ page }) => {
    productConfig = new ProductConfig(page);
    checkout = new Checkout(page);
    basket = new Basket(page);
    await page.goto(URLs.basket);
  });

  newUser("Logged in customer", async ({ page }: { page: Page }) => {
    // Runs on a freshly-registered, auto-logged-in `newUser` (via the fixture's
    // auto _authReady) rather than the SHARED checkoutUser. Two reasons:
    //  1. The default registration brand offers BankTransfer — proven by the
    //     hosting/domain journeys and standalone-billing's product-setup chain —
    //     whereas checkoutUser's brand does not render it at all.
    //  2. A fresh, isolated account cannot have its basket polluted by parallel
    //     basket-mutating specs (login, update-billing, auth-overlay-routes), so
    //     the seed below is deterministic and needs no explicit basket clear.
    //
    // Capture the raw product BEFORE navigation so the schema-driven helper can
    // satisfy whatever required option categories staging has configured on the
    // apparel product — this spec hand-codes none of them.
    const rawProductPromise = captureProduct(page);
    await page.goto(GENERIC_PRODUCT_URL);
    const rawProduct = await rawProductPromise;
    await applySchemaDefaults(page, rawProduct);

    await productConfig.addToBasket.click();
    await basket.proceedToCheckout.click();
    await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
    await checkout.clickCompleteCheckout();
    await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();
  });
});
