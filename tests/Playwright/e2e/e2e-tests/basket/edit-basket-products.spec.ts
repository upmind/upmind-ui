import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Basket } from "../../support/page-objects/templates/basket";
import { getSessionToken } from "../../support/api/auth";
import {
  createOrder,
  addProductToOrder,
  getBasketProducts
} from "../../support/api/basket";
import { interceptUISchema } from "../../support/mocks/brand";
import { waitForSessionCookie } from "../../support/helpers/session";
import { products } from "../../support/constants/products";
import { TEST_EMAILS } from "../../support/constants/test-data";

let productConfig: ProductConfig;
let basket: Basket;

test.describe("Edit hosting product in basket", () => {
  let token: string;
  let orderId: string | null;
  let products: any;
  let productId: string;
  test.beforeEach(async ({ page, context }) => {
    productConfig = new ProductConfig(page);
    basket = new Basket(page);
    interceptUISchema(context, {
      "@context.basket.productConfigFieldsSummary": "visible"
    });
    await page.goto("/");
    await waitForSessionCookie(context);
    token = await getSessionToken(context);
    let order = await createOrder(token);
    orderId = order.id;
    await addProductToOrder(
      `${token}`,
      `${orderId}`,
      "3de78642-de53-9714-76df-21208469530d",
      1,
      24,
      [],
      [],
      {
        domain: `${fakerEN_GB.string.alphanumeric({
          length: { min: 3, max: 15 }
        })}.com`
      },
      [],
      true,
      false
    );
  });
  test("Edit product options", async ({ page }) => {
    products = await getBasketProducts(token);
    productId = products[0].id;
    await page.goto(`order/basket/edit/${productId}`);
    await productConfig.selectRadioOption("London");
    await expect(productConfig.getSummaryItem("Location")).toBeVisible();
    await productConfig.clickConfirm();
    await expect(page).toHaveURL("order/basket/");
    await basket.clickShowDetails();
    await expect(basket.basketProduct).toContainText("London");
  });

  /**
   * FE-2805: Domain selection should be cleared when changing to "I'll decide later"
   *
   * When a hosting product has a domain linked and user edits it to select
   * "Continue without domain", the previous domain selection should be cleared.
   */
  test("Changing domain to 'Continue without domain' clears previous selection", async ({
    page
  }) => {
    products = await getBasketProducts(token);
    productId = products[0].id;

    // Navigate to edit the product that has a domain linked
    await page.goto(`order/basket/edit/${productId}`);
    await expect(productConfig.productConfigSection).toBeVisible();

    // Select "Continue without domain" (skip)
    await productConfig.domainRadioSkip.click();

    // Confirm the changes
    await productConfig.clickConfirm();
    await expect(page).toHaveURL("order/basket/");

    // Verify the basket product no longer shows a domain
    await basket.clickShowDetails();
    // The domain field should be empty or show "No domain" / similar
    // Check that the original domain is NOT visible
    await expect(basket.basketProduct).not.toContainText(".com");
  });
});

test.describe("Edit domain product in basket", () => {
  let token: string;
  let orderId: string | null;
  let productId: string;
  test.beforeEach(async ({ page, context }) => {
    productConfig = new ProductConfig(page);
    basket = new Basket(page);
    await page.goto(URLs.basket);
    await waitForSessionCookie(context);
    token = await getSessionToken(context);
    let order = await createOrder(token);
    orderId = order.id;
    await addProductToOrder(
      `${token}`,
      `${orderId}`,
      products.DOMAIN.id,
      1,
      12,
      [],
      [],
      {
        sld: `${fakerEN_GB.string.alphanumeric({ length: { min: 3, max: 15 } })}`,
        update_registrant_address_1: `${fakerEN_GB.location.streetAddress()}`,
        update_registrant_address_city: `${fakerEN_GB.location.city()}`,
        update_registrant_address_country_code: "GB",
        update_registrant_address_postcode: `${fakerEN_GB.location.zipCode()}`,
        update_registrant_email: TEST_EMAILS.domainRegistrant,
        update_registrant_name: "Domain Tester",
        update_registrant_organisation: "Domain Testinc Inc",
        update_registrant_phone: "+447111111111"
      },
      [],
      true,
      false
    );
  });
  test("Edit domain name", async ({ page }) => {
    let basketProducts = await getBasketProducts(token);
    productId = basketProducts[0].id;
    let newDomain = `${fakerEN_GB.string.alphanumeric({ length: { min: 3, max: 15 } })}`;
    await page.goto(`order/basket/edit/${productId}`);
    await expect(productConfig.productConfigSection).toBeVisible();
    await productConfig.clearFormInput("form-item-provision-fields-sld");
    await productConfig.fillFormInput(
      "form-item-provision-fields-sld",
      newDomain
    );
    await productConfig.clickConfirm();
    await expect(page).toHaveURL("order/basket/");
    await expect(
      basket.basketProduct.getByTestId("link-default").getByText(newDomain)
    ).toBeVisible();
  });
  test("Edit provisional fields", async ({ page, context }) => {
    interceptUISchema(context, {
      "@context.configure.productConfigFieldsSummary": "visible",
      "@context.configure.productConfigOptionsSummary": "visible"
    });
    let fieldUpdates = {
      updatedName: "Updated Name",
      updatedCompany: "Updated Company",
      updatedEmail: "updated-email@upmind.com",
      updatedPhone: "7222222222",
      updatedAddress: "Updated Address Line 1",
      updatedCity: "Updated City",
      updatedState: "Updated State",
      updatedPostcode: "UP11 1UP",
      updatedCountryCode: "BT"
    };
    let basketProducts = await getBasketProducts(token);
    productId = basketProducts[0].id;
    await page.goto(`order/basket/edit/${productId}`);
    await expect(productConfig.productConfigSection).toBeVisible();
    await productConfig.registrantNameInput.fill(fieldUpdates.updatedName);
    await productConfig.registrantOrgInput.fill(fieldUpdates.updatedCompany);
    await productConfig.registrantEmailInput.fill(fieldUpdates.updatedEmail);
    await productConfig.registrantPhoneInput.fill(fieldUpdates.updatedPhone);
    await productConfig.registrantAddr1Input.fill(fieldUpdates.updatedAddress);
    await productConfig.registrantCityInput.fill(fieldUpdates.updatedCity);
    await productConfig.registrantStateInput.fill(fieldUpdates.updatedState);
    await productConfig.registrantPostcodeInput.fill(
      fieldUpdates.updatedPostcode
    );
    await productConfig.registrantCountryInput.click();
    await page
      .getByTestId(`select-item-${fieldUpdates.updatedCountryCode}`)
      .click();
    await productConfig.clickConfirm();
    await expect(page).toHaveURL("order/basket/");
    await expect(basket.basketProductSummary).toBeVisible();
    await expect(basket.addMissingDataLink).toBeHidden();
  });
});
