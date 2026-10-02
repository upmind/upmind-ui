// -----------------------------------------------------------------------------
/**
 * @fileoverview Returning to an order that already exists: the cold path
 *
 * ## Job To Be Done
 * Load `/order/<invoice id>` cold for unpaid, paid and partly paid invoices against the recorded body.
 *
 * ## What Breaks If These Fail
 * The order page still renders after the invoice extraction, but with the wrong figures.
 */

import { expect } from "@playwright/test";
import { newUser } from "../../support/fixtures/auth-context";
import { registerClientViaHeadless } from "../../support/flows/auth-setup";
import { goToCheckout } from "../../support/flows/checkout";
import { coldLoadOrder, orderRoute } from "../../support/flows/order-cold-load";
import { createUnpaidInvoice } from "../../support/flows/unpaid-invoice";
import { gateways } from "../../support/constants/gateways";
import { products } from "../../support/constants/products";
import { URLs } from "../../support/constants/urls";
import type { RecordedInvoice } from "../../support/flows/order-cold-load";
import type { Page } from "@playwright/test";

// -----------------------------------------------------------------------------

const CARD = { number: "4242424242424242", expiry: "12/50", cvc: "123" };

const MONEY_PATH_TIMEOUT = 240000;

const PARTIAL_AMOUNT = "20";

// -----------------------------------------------------------------------------

function heading(page: Page) {
  return page.getByTestId("order-confirmation-heading");
}

function heroCopy(page: Page) {
  return heading(page).locator("xpath=..");
}

function detailRow(page: Page, key: string) {
  return page.getByTestId(key);
}

function orderProducts(page: Page) {
  return page.locator("#order-products");
}

function paymentForm(page: Page) {
  return page.locator("#payment-details");
}

function gatewayTiles(page: Page) {
  return paymentForm(page).getByTestId("gateway");
}

async function payableSurface(page: Page) {
  return {
    forms: await paymentForm(page).count(),
    gateways: await page.getByTestId("gateway").count()
  };
}

async function renderedRows(page: Page) {
  const table = orderProducts(page);
  const read = (key: string) =>
    table
      .getByTestId(key)
      .evaluateAll(nodes =>
        nodes.map(node => node.getAttribute("data-test-value") ?? "")
      );

  return {
    ids: await read("order-product-item"),
    prices: await read("price"),
    quantities: await read("qty"),
    totals: await read("total")
  };
}

function latestPayment(invoice: RecordedInvoice) {
  return [...invoice.payments].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  )[0];
}

async function screenText(page: Page) {
  return (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
}

async function expectInvoiceReadBack(page: Page, invoice: RecordedInvoice) {
  await expect(
    detailRow(page, "confirmation-invoice-number"),
    "the invoice number the API returned never reached the screen"
  ).toHaveAttribute("data-test-value", invoice.number);

  const numberShown = (
    await detailRow(page, "confirmation-invoice-number")
      .locator("dd")
      .textContent()
  )?.trim();
  expect(
    numberShown,
    "the invoice number shown to the customer is not the one the API returned"
  ).toBe(invoice.number);

  const dateRow = detailRow(page, "confirmation-order-date");
  const dateShown = (await dateRow.locator("dd").textContent())?.trim();
  expect(dateShown, "the purchase date row rendered empty").toBeTruthy();
  await expect(
    dateRow,
    "the purchase date row's stable value disagrees with the date on screen"
  ).toHaveAttribute("data-test-value", dateShown as string);

  await expect(
    page.getByTestId("description-list"),
    "the order total the API returned is not in the order summary"
  ).toContainText(invoice.total_amount_formatted);

  const rows = await renderedRows(page);
  expect(
    rows.ids,
    "the line items on screen are not the products on the invoice"
  ).toEqual(invoice.products.map(product => product.product_id));
  expect(
    rows.quantities,
    "a line item's quantity is not the quantity the API returned"
  ).toEqual(invoice.products.map(product => String(product.quantity)));
  expect(
    rows.prices,
    "a line item's price is not the price the API returned"
  ).toEqual(
    invoice.products.map(product => product.configuration_net_amount_formatted)
  );
  expect(
    rows.totals,
    "a line item's total is not the total the API returned"
  ).toEqual(
    invoice.products.map(product => product.configuration_net_amount_formatted)
  );

  await expect(
    orderProducts(page),
    "the order table's subtotal is not the net amount the API returned"
  ).toContainText(invoice.net_amount_formatted);
  await expect(
    orderProducts(page),
    "the order table's total is not the total the API returned"
  ).toContainText(invoice.total_amount_formatted);
}

// -----------------------------------------------------------------------------

newUser.describe("an order loaded cold, not reached through checkout", () => {
  newUser.describe.configure({ mode: "parallel" });

  newUser(
    "shows an unpaid invoice as still owing, and offers a way to pay it",
    async ({ page, checkout, confirmation }) => {
      newUser.setTimeout(MONEY_PATH_TIMEOUT);

      const invoiceId = await createUnpaidInvoice(
        page,
        checkout,
        confirmation,
        gateways.OFFLINE
      );

      const cold = await coldLoadOrder(page.context(), invoiceId);
      const invoice = await cold.recorded();

      expect(
        invoice.status.code,
        "the invoice this case needs was not left unpaid by the checkout"
      ).not.toBe("invoice_paid");

      await expect(heading(cold.page)).toBeVisible({ timeout: 60000 });
      await expectInvoiceReadBack(cold.page, invoice);

      const alert = cold.page.getByTestId("confirmation-payment-alert");
      await expect(
        alert,
        "an invoice with a balance said nothing about payment being due"
      ).toBeVisible();
      await expect(alert).toHaveAttribute("data-test-value", "due");
      await expect(
        alert,
        "the amount due on screen is not the unpaid amount the API returned"
      ).toContainText(invoice.unpaid_amount_formatted);

      await expect(
        paymentForm(cold.page),
        "an invoice that is still owed offered no way to pay it"
      ).toBeVisible();
      await expect(
        gatewayTiles(cold.page).first(),
        "the invoice's own payment methods never reached the screen"
      ).toBeVisible({ timeout: 60000 });

      expect(
        await orderProducts(cold.page).getByTestId("button").count(),
        "the completed-order CTA appeared on an invoice that is still owed"
      ).toBe(0);

      await cold.page.close();
    }
  );

  newUser(
    "shows a settled invoice as settled, and offers no way to pay it again",
    async ({ page, checkout, confirmation }) => {
      newUser.setTimeout(MONEY_PATH_TIMEOUT);

      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails(CARD.number, CARD.expiry, CARD.cvc);
      await checkout.clickCompleteCheckout();
      await expect(confirmation.invoiceNumber).toBeVisible({ timeout: 90000 });
      const invoiceId = /\/order\/([0-9a-f-]{36})/.exec(page.url())?.[1];
      expect(
        invoiceId,
        `the card checkout never reached a confirmation URL: ${page.url()}`
      ).toBeTruthy();

      const cold = await coldLoadOrder(page.context(), invoiceId as string);
      const invoice = await cold.recorded();

      expect(
        invoice.status.code,
        "the card payment did not settle the invoice, so this case is not testing a settled one"
      ).toBe("invoice_paid");

      await expect(heading(cold.page)).toBeVisible({ timeout: 60000 });
      await expectInvoiceReadBack(cold.page, invoice);

      expect(
        await cold.page.getByTestId("confirmation-payment-alert").count(),
        "a settled invoice warned the customer about payment"
      ).toBe(0);
      const settled = await payableSurface(cold.page);
      expect(
        settled.forms,
        "a settled invoice offered a payment form — it could be charged twice"
      ).toBe(0);
      expect(
        settled.gateways,
        "a settled invoice offered payment methods"
      ).toBe(0);

      await expect(
        orderProducts(cold.page).getByTestId("button"),
        "the completed order did not carry its account CTA"
      ).toBeVisible();

      const expectedLast4 = latestPayment(invoice)?.payment_details?.card_last4;
      const methodRow = detailRow(
        cold.page,
        "confirmation-order-payment-method"
      );
      if (expectedLast4) {
        await expect(
          methodRow,
          "the card the API reported against this invoice is not on screen"
        ).toHaveAttribute("data-test-value", expectedLast4);
      } else {
        expect(
          await methodRow.count(),
          "a payment method was shown for a payment the API carries no card details for"
        ).toBe(0);
      }

      await expect
        .poll(() => cold.page.url(), {
          timeout: 30000,
          message:
            "a settled invoice loaded cold did not stamp its own payment_success state onto the URL"
        })
        .toContain("payment_success=true");

      await cold.page.close();
    }
  );

  newUser(
    "shows a part-paid invoice what it still owes, and what it already paid",
    async ({ page, checkout, confirmation }) => {
      newUser.setTimeout(MONEY_PATH_TIMEOUT);

      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill(PARTIAL_AMOUNT);
      await checkout.clickConfirmAmount();
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails(CARD.number, CARD.expiry, CARD.cvc);
      await checkout.clickCompleteCheckout();
      await expect(confirmation.invoiceNumber).toBeVisible({ timeout: 90000 });
      const invoiceId = /\/order\/([0-9a-f-]{36})/.exec(page.url())?.[1];
      expect(
        invoiceId,
        `the partial checkout never reached a confirmation URL: ${page.url()}`
      ).toBeTruthy();

      const cold = await coldLoadOrder(page.context(), invoiceId as string);
      const invoice = await cold.recorded();

      expect(
        invoice.status.code,
        "the partial payment settled the whole invoice, so this case is not testing a part-paid one"
      ).not.toBe("invoice_paid");

      await expect(heading(cold.page)).toBeVisible({ timeout: 60000 });
      await expectInvoiceReadBack(cold.page, invoice);

      const outstanding = cold.page.getByTestId(
        "confirmation-payment-secondary-alert"
      );
      await expect(
        outstanding,
        "a part-paid invoice did not tell the customer a balance remains"
      ).toBeVisible();
      await expect(outstanding).toHaveAttribute(
        "data-test-value",
        "outstanding"
      );
      await expect(
        outstanding,
        "the remaining balance on screen is not the unpaid amount the API returned"
      ).toContainText(invoice.unpaid_amount_formatted);

      await expect(
        heroCopy(cold.page),
        "the amount already paid on screen is not the paid amount the API returned"
      ).toContainText(invoice.paid_amount_formatted);

      await expect(
        paymentForm(cold.page),
        "a part-paid invoice offered no way to pay the remainder"
      ).toBeVisible();
      await expect(
        gatewayTiles(cold.page).first(),
        "a part-paid invoice offered no payment method for the remainder"
      ).toBeVisible({ timeout: 60000 });

      await cold.page.close();
    }
  );

  newUser(
    "tells a different client the order was not found, and shows them none of it",
    async ({ page, checkout, confirmation, browser }) => {
      newUser.setTimeout(MONEY_PATH_TIMEOUT);

      const invoiceId = await createUnpaidInvoice(
        page,
        checkout,
        confirmation,
        gateways.OFFLINE
      );

      const owner = await coldLoadOrder(page.context(), invoiceId);
      const invoice = await owner.recorded();
      await owner.page.close();

      const stranger = await browser.newContext();
      try {
        const strangerPage = await stranger.newPage();
        await strangerPage.goto(URLs.baseUrl);
        await registerClientViaHeadless(strangerPage);

        const cold = await coldLoadOrder(stranger, invoiceId);
        await expect(heading(cold.page)).toBeVisible({ timeout: 60000 });

        const shown = await screenText(cold.page);

        expect(
          await detailRow(cold.page, "confirmation-invoice-number").count(),
          `another client's invoice number was rendered — ${shown.slice(0, 300)}`
        ).toBe(0);
        expect(
          shown,
          "another client's invoice number leaked onto the page"
        ).not.toContain(invoice.number);
        expect(
          await orderProducts(cold.page).count(),
          "another client's line items were rendered"
        ).toBe(0);
        expect(
          await cold.page.locator("#order-details").count(),
          "another client's order summary was rendered"
        ).toBe(0);
        const refused = await payableSurface(cold.page);
        expect(
          refused.forms,
          "a different client was offered a way to pay someone else's invoice"
        ).toBe(0);
        expect(
          refused.gateways,
          "a different client was offered payment methods for someone else's invoice"
        ).toBe(0);

        await expect(
          cold.page.locator("main").getByRole("button").first(),
          "the refused client was left with nothing to do"
        ).toBeVisible();

        await cold.page.close();
      } finally {
        await stranger.close();
      }
    }
  );

  newUser(
    "never puts a visitor with no session on the order at all",
    async ({ page, checkout, confirmation, browser }) => {
      newUser.setTimeout(MONEY_PATH_TIMEOUT);

      const invoiceId = await createUnpaidInvoice(
        page,
        checkout,
        confirmation,
        gateways.OFFLINE
      );

      const owner = await coldLoadOrder(page.context(), invoiceId);
      const invoice = await owner.recorded();
      await owner.page.close();

      const visitor = await browser.newContext();
      try {
        const cold = await coldLoadOrder(visitor, invoiceId);

        await expect
          .poll(() => cold.page.url(), {
            timeout: 60000,
            message: `a visitor with no session was left on the order route: ${orderRoute(invoiceId)}`
          })
          .not.toContain(invoiceId);

        const shown = await screenText(cold.page);

        expect(
          cold.requests(),
          "the surface asked the API for an invoice on behalf of a visitor with no session"
        ).toBe(0);
        expect(
          shown,
          "an invoice number was shown to a visitor with no session"
        ).not.toContain(invoice.number);
        expect(
          await orderProducts(cold.page).count(),
          "line items were shown to a visitor with no session"
        ).toBe(0);
        const anonymous = await payableSurface(cold.page);
        expect(
          anonymous.forms,
          "a visitor with no session was offered a way to pay"
        ).toBe(0);
        expect(
          anonymous.gateways,
          "a visitor with no session was offered payment methods"
        ).toBe(0);

        await cold.page.close();
      } finally {
        await visitor.close();
      }
    }
  );
});
