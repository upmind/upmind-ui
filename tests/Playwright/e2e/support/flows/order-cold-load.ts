// -----------------------------------------------------------------------------
/**
 * @module e2e/support/flows/order-cold-load
 * @description Loads `/order/<id>` cold and records the `/invoices/{id}` body it renders from.
 */

import { expect } from "@playwright/test";
import { URLs } from "../constants/urls";
import type { BrowserContext, Page } from "@playwright/test";

// -----------------------------------------------------------------------------

export function orderRoute(invoiceId: string): string {
  return `${URLs.baseUrl}order/${invoiceId}/`;
}

export type RecordedInvoice = {
  number: string;
  locked: number | boolean | null;
  status: { code: string };
  create_datetime: string;
  due_date: string;
  net_amount_formatted: string;
  total_amount_formatted: string;
  paid_amount_formatted: string;
  unpaid_amount_formatted: string;
  products: {
    product_id: string;
    quantity: number;
    configuration_net_amount_formatted: string;
  }[];
  payments: {
    pending: boolean;
    created_at: string;
    payment_details: { card_type?: string; card_last4?: string } | null;
  }[];
};

export type ColdOrder = {
  page: Page;
  requests: () => number;
  recorded: (timeout?: number) => Promise<RecordedInvoice>;
};

export async function coldLoadOrder(
  context: BrowserContext,
  invoiceId: string
): Promise<ColdOrder> {
  const page = await context.newPage();
  const seen: string[] = [];
  const bodies: unknown[] = [];

  page.on("response", response => {
    if (!response.url().includes(`/invoices/${invoiceId}`)) return;
    seen.push(response.url());
    // The body is unreadable once the page navigates, so read it eagerly.
    void response
      .json()
      .then(body => bodies.push(body))
      .catch(() => undefined);
  });

  await page.goto(orderRoute(invoiceId));

  return {
    page,
    requests: () => seen.length,
    recorded: async (timeout = 60000) => {
      await expect
        .poll(() => bodies.length, {
          timeout,
          message: `the order surface never fetched /invoices/${invoiceId}`
        })
        .toBeGreaterThan(0);

      const body = bodies[bodies.length - 1] as {
        data?: RecordedInvoice;
      } & RecordedInvoice;
      const invoice = body?.data ?? body;

      expect(
        invoice?.number,
        `/invoices/${invoiceId} answered without an invoice: ${JSON.stringify(body).slice(0, 300)}`
      ).toBeTruthy();

      return invoice;
    }
  };
}
