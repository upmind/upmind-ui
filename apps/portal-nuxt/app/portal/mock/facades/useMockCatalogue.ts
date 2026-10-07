// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockCatalogue
 * @description The brand's orderable catalogue, managed — `placeOrder` is
 * legacy's place-new-order outcome, mocked: a processing order, its unpaid
 * invoice, and the product awaiting activation.
 *
 * The one place in this layer that does arithmetic: the store IS the mock's
 * server, so it sums the document's lines (plan R6). Nothing downstream may.
 */

import {
  ContractStatusCodes,
  InvoiceConsolidationTypes,
  InvoiceStatus
} from "@upmind-automation/types";
import { grossBreakdown, shareTokenFor, zeroOf } from "../documents";
import { mockMoney } from "../money";
import { idFor, nextSequence } from "../store";
import {
  MOCK_BILLING_TYPE,
  MOCK_INVOICE_CATEGORY,
  MOCK_ORDER_STATUS
} from "../types";
import { defineMockFacade } from "./facade";
import { find, map, sumBy } from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type { MockCatalogueItem, MockInvoiceLine, MockOrder } from "../types";
// -----------------------------------------------------------------------------

export const useMockCatalogue = defineMockFacade(
  (data): readonly MockCatalogueItem[] => data.catalogue,
  data => ({
    /** Orders one catalogue item — the order, its invoice and its product, in one step. */
    placeOrder: (
      catalogueItemId: string
    ): MockActionReceipt<MockOrder> | undefined => {
      const item = find(data.catalogue, { id: catalogueItemId });
      if (item === undefined) return undefined;

      const placedDate = new Date().toISOString().slice(0, 10);
      const lines: MockInvoiceLine[] = [
        { id: "l1", description: item.name, amount: item.chargeTotal }
      ];
      const total = mockMoney(
        sumBy(lines, line => line.amount.amount),
        item.chargeTotal.currency
      );

      const orderSequence = nextSequence();
      const order: MockOrder = {
        id: idFor("ord", orderSequence),
        number: idFor("ord", orderSequence).toUpperCase(),
        placedDate,
        total,
        status: MOCK_ORDER_STATUS.PROCESSING,
        productNames: map([item], "name"),
        items: [
          {
            id: "oi-1",
            name: item.name,
            unitPrice: item.chargeTotal,
            quantity: 1,
            total: item.chargeTotal
          }
        ],
        dates: { created: placedDate, due: placedDate }
      };
      data.orders.unshift(order);

      const invoiceSequence = nextSequence();
      const invoiceId = idFor("inv", invoiceSequence);
      const { subtotal, taxes } = grossBreakdown(total);
      data.invoices.unshift({
        id: invoiceId,
        number: invoiceId.toUpperCase(),
        issuedDate: placedDate,
        dueDate: placedDate,
        subtotal,
        taxes,
        total,
        paidAmount: zeroOf(total.currency),
        unpaidAmount: total,
        payments: [],
        // A document raised in-session snapshots the persona as it stands;
        // the seeded ones carry the address the seed authored for them.
        address: {
          name: data.persona.name,
          company: data.persona.company,
          lines: []
        },
        status: InvoiceStatus.UNPAID,
        category: MOCK_INVOICE_CATEGORY.INVOICE,
        shareToken: shareTokenFor(invoiceId),
        orderId: order.id,
        lines
      });

      const productSequence = nextSequence();
      data.products.unshift({
        id: idFor("prod", productSequence),
        contractId: idFor("ctr", productSequence),
        orderId: order.id,
        groupSlug: item.groupSlug,
        name: item.name,
        category: item.category,
        billingType: item.billingType,
        status: ContractStatusCodes.AWAITING_ACTIVATION,
        // Acquired the day the order was placed, so it leads a newest-first listing.
        createdAt: placedDate,
        purchasedAt: placedDate,
        price: item.price,
        billingTerm: item.billingTerm,
        autoRenew: item.billingType === MOCK_BILLING_TYPE.SUBSCRIPTION,
        lineItems: [
          { id: "li-base", description: item.name, amount: item.price }
        ],
        // A product ordered in-session has no provider surface yet — that
        // arrives with the setup the client has still to complete, and the
        // same is true of everything the brand schedules against it.
        provisioning: { fields: [], functions: [], iframes: [] },
        canModify: true,
        canDisableAutoRenew: true,
        pendingProRata: false,
        migrationOptions: [],
        scheduledActions: [],
        invoiceConsolidation: InvoiceConsolidationTypes.INHERIT
      });

      return { ok: true, entity: order };
    }
  })
);
