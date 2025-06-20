import { test, expect } from "@playwright/test";
import { URLs } from "../support/constants/Urls";
import { ProductConfig } from "../support/page-objects/templates/ProductConfig";
import { Basket } from "../support/page-objects/templates/Basket";
import {
  getCurrentOrderId,
  addProductToOrder,
} from "../support/utils/functions/basket";
import {
  getSessionToken,
  getClientToken,
} from "../support/utils/functions/tokens";
import { Logins } from "../support/constants/Logins";

let productConfig: ProductConfig;
let basket: Basket;

test.describe("Promotions", () => {
  test.beforeEach(async ({ page }) => {
    productConfig = new ProductConfig(page);
    basket = new Basket(page);
  });
  test.describe("Auto-Applied Promotions", () => {
    test.describe("Basic Config Settings", () => {
      test("Is Active - No", async ({ page }) => {
        await page.goto(URLs.inactivePromo);
        await page.waitForLoadState();
        await productConfig.promoBadgeDoesNotExist();
      });
    });
    test.describe("Discounts and Conditions", () => {
      test.describe("Discount Amounts", () => {
        test("Fixed Discount Amount", async ({ page }) => {
          await page.goto(URLs.fixedDiscount);
          await page.waitForLoadState();
          await productConfig.promoBadgeDoesNotExist();
        });
        test("Percentage Discount Amount", async ({ page }) => {
          await page.goto(URLs.percentageDiscount);
          await page.waitForLoadState();
          await productConfig.promoBadgeExists();
        });
      });
      test.describe("Application per currency", () => {
        test("Apply for all currencies - No - Apply for GBP", async ({
          page,
        }) => {
          await page.goto(URLs.gbpPromo);
          await page.waitForLoadState();
          await productConfig.promoBadgeExists();
        });
        test("Apply for all currencies - No - Apply for USD", async ({
          page,
        }) => {
          await page.goto(URLs.usdPromo);
          await page.getByTestId("popover-trigger").click();
          await page.getByTestId("combobox-item").nth(1).click();
          await page.waitForLoadState();
          await productConfig.promoBadgeExists();
        });
      });
      test.describe("Application per billing term", () => {
        test("Apply for all billing terms - No (1 Year Billing term only)", async ({
          page,
        }) => {
          await page.goto(URLs.oneYearPromo);
          await page.waitForLoadState();
          await expect(
            productConfig.getPromoBadge(
              productConfig.radioButtons.getRadioButton(0, 1)
            )
          ).toBeDefined();
        });
      });
      test.describe("Application per price list", () => {
        test("Apply for all price lists - No", async ({ page }) => {
          await page.goto(URLs.priceListPromo);
          await productConfig.promoBadgeDoesNotExist();
          await getClientToken(
            page,
            Logins.priceListUser.username,
            Logins.priceListUser.password
          );
          await page.goto(URLs.priceListPromo);
          await page.waitForLoadState();
          await productConfig.promoBadgeExists();
        });
      });
    });
  });
  test.describe("Availability & Eligibility Settings", () => {
    test.describe.skip("Apply to multiple renewals", () => {
      test("Promotion applied on recurring renewals - Multiple (1 renewal)", async ({
        page,
      }) => {
        // TBC
      });
      test("Promotion applied on recurring renewals - Unlimited", async ({
        page,
      }) => {
        // TBC
      });
    });
    test.describe("Use for new clients", () => {
      test("Exclusively for new clients", async ({ page }) => {
        page.goto(URLs.newClientPromo);
        await productConfig.promoBadgeExists();
        await getClientToken(
          page,
          Logins.priceListUser.username,
          Logins.priceListUser.password
        );
        page.reload();
        await productConfig.promoBadgeDoesNotExist();
      });
    });
    test.describe("Use for existing clients", () => {
      test("Exclusively for existing clients", async ({ page }) => {
        await page.goto(URLs.baseUrl);
        await getClientToken(
          page,
          Logins.checkoutUser.username,
          Logins.checkoutUser.password
        );
        page.goto(URLs.existingClientPromo);
        await page.waitForLoadState();
        await productConfig.promoBadgeExists();
        await page.goto(URLs.logout);
        await page.goto(URLs.existingClientPromo);
        await productConfig.promoBadgeDoesNotExist();
      });
    });
    test.describe("Use for upgrade clients", () => {
      test("Exclusively for upgrade clients", async ({ page }) => {});
    });
  });
  test.describe("Promotions - Added at basket", () => {
    test.describe("Use with other promotions", () => {
      test.beforeAll(async ({ page, context }) => {
        await getClientToken(
          page,
          Logins.checkoutUser.username,
          Logins.checkoutUser.password
        );
        await page.goto(URLs.basket);
        await page.waitForLoadState("networkidle");
        const token = await getSessionToken(context, "client");
        const orderId = await getCurrentOrderId(token);
        await addProductToOrder(
          `${token}`,
          `${orderId}`,
          "20403869-6e54-721d-264c-518d9305e7d2",
          1,
          1,
          [],
          [],
          {},
          []
        );
      });
      test("Use with other promotions - Yes", async ({ page }) => {
        await page.goto(URLs.basket);
        await basket.enterPromoCode("genericpromo");
        await basket.applyPromo.click();
        await basket.enterPromoCode("otherpromotionsyes");
        await basket.applyPromo.click();
        await expect(basket.promoBadge.getByText("genericpromo")).toBeDefined;
        await expect(basket.promoBadge.getByText("otherpromotionsno"))
          .toBeDefined;
      });
      test("Use with other promotions - No", async ({ page }) => {
        await page.goto(URLs.basket);
        await basket.enterPromoCode("genericpromo");
        await basket.applyPromo.click();
        await basket.enterPromoCode("otherpromotionsno");
        await basket.applyPromo.click();
        await expect(basket.promoMessage).toContainText(
          "Unable to combine promotion otherpromotionsno with other promotions"
        );
        await expect(basket.promoBadge.getByText("genericpromo")).toBeDefined;
        await expect(basket.promoBadge.getByText("otherpromotionsno"))
          .toBeUndefined;
      });
    });
  });
  test.describe("Custom conditions per product", () => {});
  test.describe("Single Use Promotions", () => {
    test.beforeAll(async ({ page, context }) => {
      await getClientToken(
        page,
        Logins.checkoutUser.username,
        Logins.checkoutUser.password
      );
      await page.goto(URLs.basket);
      await page.waitForLoadState("networkidle");
      const token = await getSessionToken(context, "client");
      const orderId = await getCurrentOrderId(token);
      await addProductToOrder(
        `${token}`,
        `${orderId}`,
        "2785d26e-9678-3d16-934b-314502e70439",
        1,
        1,
        [],
        [],
        {},
        []
      );
    });
    test("Single use promotion - Yes", async ({ page, context }) => {
      await page.goto(URLs.basket);
      await basket.enterPromoCode("singleusepromo");
      await basket.applyPromo.click();
      await expect(basket.promoMessage).toContainText(
        "Promotion exceeds max uses!"
      );
      await expect(basket.promoBadge).toBeUndefined;
    });
  });
});
