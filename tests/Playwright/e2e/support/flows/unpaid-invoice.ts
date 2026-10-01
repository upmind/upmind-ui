// -----------------------------------------------------------------------------
/**
 * @module e2e/support/flows/unpaid-invoice
 * @description Makes a real unpaid invoice through checkout and reads its id off the confirmation URL.
 */

import { expect } from "@playwright/test";
import { goToCheckout } from "./checkout";
import { gateways } from "../constants/gateways";
import { products } from "../constants/products";
import type { Page } from "@playwright/test";
import type { Checkout } from "../../support/page-objects/templates/checkout";
import type { Confirmation } from "../page-objects/templates/confirmation";

// -----------------------------------------------------------------------------

const CONFIRMATION_PATH = /\/order\/([0-9a-f-]{36})/;

async function unpaidInvoiceId(page: Page): Promise<string> {
  await expect
    .poll(() => CONFIRMATION_PATH.test(page.url()), { timeout: 60000 })
    .toBe(true);

  const id = CONFIRMATION_PATH.exec(page.url())?.[1];
  expect(
    id,
    `no invoice id on the confirmation URL: ${page.url()}`
  ).toBeTruthy();
  return id as string;
}

export async function createUnpaidInvoice(
  page: Page,
  checkout: Checkout,
  confirmation: Confirmation,
  gatewayType: string = gateways.BANK_TRANSFER
): Promise<string> {
  await goToCheckout(page, products.STARTER_HOSTING, null, null);
  await checkout.selectGatewayByType(gatewayType);
  await checkout.clickCompleteCheckout();
  await expect(confirmation.invoiceNumber).toBeVisible({ timeout: 60000 });

  return unpaidInvoiceId(page);
}
