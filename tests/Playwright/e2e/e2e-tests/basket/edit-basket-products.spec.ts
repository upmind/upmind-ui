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
    await page.goto(URLs.baseUrl);
    await page.waitForLoadState("networkidle");
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
    await page.waitForLoadState("networkidle");
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
  test("Edit product attributes", async ({ page }) => {
    products = await getBasketProducts(token);
    productId = products[0].id;
    await page.goto(`order/basket/edit/${productId}`);
    await productConfig.selectRadioOption(
      "MacOS Sequoia Version 15.6 (Enterprise License)"
    );
    await expect(
      productConfig.getSummaryItem("Operating System")
    ).toBeVisible();
    await productConfig.clickConfirm();
    await expect(page).toHaveURL("order/basket/");
    await basket.clickShowDetails();
    await expect(basket.basketProduct).toContainText(
      "MacOS Sequoia Version 15.6 (Enterprise License)"
    );
  });
});

test.describe("Edit domain product in basket", () => {
  let token: string;
  let orderId: string | null;
  let products: any;
  let productId: string;
  test.beforeEach(async ({ page, context }) => {
    productConfig = new ProductConfig(page);
    basket = new Basket(page);
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    token = await getSessionToken(context);
    let order = await createOrder(token);
    orderId = order.id;
    await addProductToOrder(
      `${token}`,
      `${orderId}`,
      "320e4357-95e7-8d18-050b-31643202d986",
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
        update_registrant_email: "nathan.robinson+domaintester@upmind.com",
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
    products = await getBasketProducts(token);
    productId = products[0].id;
    let newDomain = `${fakerEN_GB.string.alphanumeric({ length: { min: 3, max: 15 } })}`;
    await page.goto(`order/basket/edit/${productId}`);
    await page.waitForLoadState("networkidle");
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
    products = await getBasketProducts(token);
    productId = products[0].id;
    await page.goto(`order/basket/edit/${productId}`);
    await page.waitForLoadState("networkidle");
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
