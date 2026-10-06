// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/billing-contexts
 * @description What the billing pillar's schema modules are handed (plan F3,
 * F4) — each module's own context type, built from the live dataset. The
 * lookups are the dataset's own facts, so a brand that trades in one currency
 * and a brand that trades in two render different forms from the same schema.
 */

import { brandConsolidationSchedule } from "../contracts/client-billing-settings.schemas";
import { shareLinkFor } from "../documents";
import {
  offersPaymentCurrency,
  isInvoiceOwed,
  useMockBillingSettings,
  useMockWallet
} from "../facades";
import { paymentMethodLabel } from "../payment-label";
import { PORTAL_FORM_CURRENCIES } from "./engine-data";
import { find, map } from "lodash-es";
import type { BillingSettingsContext } from "../contracts/client-billing-settings";
import type { InvoiceShareContext } from "../contracts/client-invoices.share.schemas";
import type { WalletTopUpContext } from "../contracts/client-wallet";
import type { MockDataset, MockInvoice } from "../types";
// -----------------------------------------------------------------------------

/**
 * What `client-billing-settings`'s own `useSchema` / `useUischema` are handed.
 * The payment currency is a LOOKUP rather than a gate: the schema offers the
 * control where there is a list to offer, so the brand fact is spent here and
 * the schema stays a function of its context.
 */
export function billingSettingsFormContext(
  data: MockDataset
): BillingSettingsContext {
  const { settings, priceLists } =
    useMockBillingSettings(data).useContext().data.value;
  return {
    currencies: [...PORTAL_FORM_CURRENCIES],
    paymentCurrencies: paymentCurrencies(data),
    priceLists: map(priceLists, list => ({
      id: list.id,
      name: list.name,
      currencyCode: list.currency
    })),
    model: {
      currencyCode: settings.currency,
      paymentCurrencyCode: settings.paymentCurrency,
      priceListId: settings.priceListId,
      consolidation: settings.consolidation,
      rule: settings.rule,
      dayOfWeek: settings.dayOfWeek,
      dayOfMonth: settings.dayOfMonth,
      dueDateDay: settings.dueDateDay
    },
    brandSchedule: brandConsolidationSchedule(
      data.features.INVOICE_CONSOLIDATION_BASE_RULE,
      data.features.INVOICE_CONSOLIDATION_WEEK_DAY,
      data.features.INVOICE_CONSOLIDATION_DATE
    )
  };
}

/**
 * The currencies a client may PAY in; none where the brand does not offer the
 * choice. The gate is the FACADE's, so the control the schema renders and the
 * member the save writes are decided by one fact rather than two readings of
 * it (`offersPaymentCurrency`).
 */
function paymentCurrencies(data: MockDataset): string[] | undefined {
  if (!offersPaymentCurrency(data)) return undefined;
  return [...PORTAL_FORM_CURRENCIES];
}

/**
 * What the SHARE dialog is handed — the link as it stands and what it may
 * permit. Paying over the link is offered only while the document is still
 * owed, which is the set legacy's own checkbox was gated on.
 */
export function invoiceShareContext(invoice: MockInvoice): InvoiceShareContext {
  return {
    link: shareLinkFor(invoice.shareToken),
    isShared: invoice.isShared === true,
    allowDownload: invoice.shareAllowsDownload === true,
    allowPayment: invoice.shareAllowsPayment === true,
    offersPayment: isInvoiceOwed(invoice)
  };
}

/**
 * What `client-wallet`'s own top-up schema is handed — the currencies this
 * client already holds credit in. A balance is per currency, so topping up
 * one the account has never traded in would mint a bucket nothing can spend.
 */
export function walletTopUpContext(data: MockDataset): WalletTopUpContext {
  return {
    currencies: map(
      useMockWallet(data).useContext().data.value.balances,
      "currency"
    ),
    // Legacy asked which stored card funds the top-up
    // (`topUpWalletModal.vue:91-101`); the account's default opens it.
    methods: map(data.paymentMethods, method => ({
      id: method.id,
      label: paymentMethodLabel(method)
    })),
    defaultMethodId: find(data.paymentMethods, { isDefault: true })?.id
  };
}
