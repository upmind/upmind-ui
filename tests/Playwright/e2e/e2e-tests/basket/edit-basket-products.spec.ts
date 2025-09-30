import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import { ProductConfig } from "../../support/page-objects/templates/ProductConfig";
import { Basket } from "../../support/page-objects/templates/Basket";
import { getSessionToken } from "../../support/utils/functions/tokens";
import {
  getCurrentOrderId,
  addProductToOrder,
  getBasketProducts
} from "../../support/utils/functions/basket";

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
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    token = await getSessionToken(context, "guest");
    orderId = await getCurrentOrderId(token);
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
      []
    );
    await page.waitForLoadState("networkidle");
  });
  test("Edit product options", async ({ page }) => {
    products = await getBasketProducts(token);
    productId = products[0].id;
    await page.goto(`order/product/edit/${productId}`);
    await page.getByTestId("radio-card-item").getByText("London").click();
    await expect(
      page.getByTestId("description-list-item-location")
    ).toBeVisible();
    await page.getByTestId("button-add-to-basket").click();
    await page.waitForLoadState("load");
    await page.getByTestId("button-show-details").click();
    await expect(page.getByTestId("basket-product")).toContainText("London");
  });
  test("Edit product attributes", async ({ page }) => {
    products = await getBasketProducts(token);
    productId = products[0].id;
    await page.goto(`order/product/edit/${productId}`);
    await page.getByTestId("radio-card-item").getByText("2 Balloons").click();
    await expect(
      page.getByTestId("description-list-item-balloons")
    ).toBeVisible();
    await page.getByTestId("button-add-to-basket").click();
    await page.waitForLoadState("load");
    await page.getByTestId("button-show-details").click();
    await expect(page.getByTestId("basket-product")).toContainText(
      "2 Balloons"
    );
  });
  test("Edit domain name", async ({ page }) => {
    products = await getBasketProducts(token);
    productId = products[0].id;
    await page.goto(`order/product/edit/${productId}`);
    const newDomain = `${fakerEN_GB.string.alphanumeric({
      length: { min: 3, max: 15 }
    })}.com`;
    await productConfig.domainExisting.getByTestId("input-url").fill(newDomain);
    await expect(
      page.getByTestId("description-list-item-account-domain-name")
    ).toContainText(newDomain);
    await page.getByTestId("button-add-to-basket").click();
    await page.waitForLoadState("load");
    await page.getByTestId("button-show-details").click();
    await expect(page.getByTestId("basket-product")).toContainText(newDomain);
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
    token = await getSessionToken(context, "guest");
    orderId = await getCurrentOrderId(token);
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
      []
    );
  });
  test("Edit domain name", async ({ page }) => {
    products = await getBasketProducts(token);
    productId = products[0].id;
    let newDomain = `${fakerEN_GB.string.alphanumeric({ length: { min: 3, max: 15 } })}`;
    await page.goto(`order/product/edit/${productId}`);
    await page.waitForLoadState("networkidle");
    await page.getByTestId("input-#/properties/sld").clear();
    await page.getByTestId("input-#/properties/sld").fill(newDomain);
    await page.getByTestId("button-add-to-basket").click();
    await page.waitForLoadState("load");
    await expect(
      page
        .getByTestId("basket-product")
        .getByTestId("button-default")
        .getByText(newDomain)
    ).toBeVisible();
    await page.getByTestId("button-show-details").click();
    await expect(
      page.getByTestId("basket-product-details-domain-names")
    ).toContainText(newDomain);
  });
  test("Edit provisional fields", async ({ page }) => {
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
    await page.goto(`order/product/edit/${productId}`);
    await page.waitForLoadState("networkidle");
    let newAddress = `${fakerEN_GB.location.streetAddress()}`;
    await page
      .getByTestId("input-#/properties/update_registrant_name")
      .fill(fieldUpdates.updatedName);
    await page
      .getByTestId("input-#/properties/update_registrant_organisation")
      .fill(fieldUpdates.updatedCompany);
    await page
      .getByTestId("input-#/properties/update_registrant_email")
      .fill(fieldUpdates.updatedEmail);
    await page
      .getByTestId("form-item-registrant-phone")
      .locator("input")
      .fill(fieldUpdates.updatedPhone);
    await page
      .getByTestId("input-#/properties/update_registrant_address_1")
      .fill(fieldUpdates.updatedAddress);
    await page
      .getByTestId("input-#/properties/update_registrant_address_city")
      .fill(fieldUpdates.updatedCity);
    await page
      .getByTestId("input-#/properties/update_registrant_address_state")
      .fill(fieldUpdates.updatedState);
    await page
      .getByTestId("input-#/properties/update_registrant_address_postcode")
      .fill(fieldUpdates.updatedPostcode);
    await page.getByTestId("form-item-registrant-country").click();
    await page
      .getByTestId(`select-item-${fieldUpdates.updatedCountryCode}`)
      .click();
    await expect(
      page.getByTestId("description-list-item-registrant-name")
    ).toContainText(fieldUpdates.updatedName);
    await expect(
      page.getByTestId("description-list-item-registrant-organisation")
    ).toContainText(fieldUpdates.updatedCompany);
    await expect(
      page.getByTestId("description-list-item-registrant-email")
    ).toContainText(fieldUpdates.updatedEmail);
    await expect(
      page.getByTestId("description-list-item-registrant-phone")
    ).toContainText(`+44${fieldUpdates.updatedPhone}`);
    await expect(
      page.getByTestId("description-list-item-registrant-address-1")
    ).toContainText(fieldUpdates.updatedAddress);
    await expect(
      page.getByTestId("description-list-item-registrant-city")
    ).toContainText(fieldUpdates.updatedCity);
    await expect(
      page.getByTestId("description-list-item-registrant-state")
    ).toContainText(fieldUpdates.updatedState);
    await expect(
      page.getByTestId("description-list-item-registrant-postcode")
    ).toContainText(fieldUpdates.updatedPostcode);
    await expect(
      page.getByTestId("description-list-item-registrant-country")
    ).toContainText(fieldUpdates.updatedCountryCode);
    await page.getByTestId("button-add-to-basket").click();
    await page.waitForLoadState("load");
    await expect(page.getByTestId("basket-product-summary")).toBeVisible();
  });
});
