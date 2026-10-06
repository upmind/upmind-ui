// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockBillingSettings
 * @description How this client is billed, managed — the mock stand-in for
 * `useClientBillingSettings` (`contracts/client-billing-settings.ts`): the
 * currency they are quoted in, the currency they pay in, the price list they
 * buy from, and whether their invoices are consolidated into one.
 *
 * Legacy showed two forms; they save together here, so the one write covers
 * the whole page (`client-billing-settings.schemas.ts`).
 */

import {
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import { defineMockFacade, submittedNumber, submittedText } from "./facade";
import { assign, find, includes, size, values } from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type { MockBillingSettings, MockDataset } from "../types";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/** The settings and the lists behind them — one read for the whole page. */
export type MockBillingSettingsView = {
  readonly settings: MockBillingSettings;
  readonly priceLists: MockDataset["priceLists"];
};

/** One submitted string, or nothing where the client cleared the field. */
function submittedOptional(model: FormModel, key: string): string | undefined {
  const value = submittedText(model, key);
  if (value === "") return undefined;
  return value;
}

/**
 * The consolidation radio's answer. A numeric enum that has been through a
 * form control is worth reading rather than trusting: an answer outside the
 * platform's own three states is no answer, and the preference on file
 * stands.
 */
function submittedConsolidation(
  model: FormModel,
  held: InvoiceConsolidationTypes
): InvoiceConsolidationTypes {
  const chosen = submittedNumber(model, "consolidation");
  if (chosen === undefined) return held;
  if (!includes(values(InvoiceConsolidationTypes), chosen)) return held;
  return chosen;
}

/**
 * The schedule rule's answer, read the same way: a rule outside the
 * platform's own five is no rule, and the one on file stands rather than a
 * free-text value reaching the dataset.
 */
function submittedRule(
  model: FormModel,
  held: InvoiceConsolidationRuleTypes | undefined
): InvoiceConsolidationRuleTypes | undefined {
  const value = submittedOptional(model, "rule");
  if (value === undefined) return undefined;
  const known = find(
    values(InvoiceConsolidationRuleTypes),
    rule => rule === value
  );
  if (known === undefined) return held;
  return known;
}

/** Whether the brand lets this client pay in a currency other than the quoted one. */
export function offersPaymentCurrency(data: MockDataset): boolean {
  return data.features.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED;
}

/** One list is what everybody is quoted from; a choice needs two. */
export function offersPriceList(data: MockDataset): boolean {
  return size(data.priceLists) > 1;
}

/** One member of a control the brand does not offer keeps whatever is on file. */
function whileOffered<TValue>(
  isOffered: boolean,
  submitted: TValue | undefined,
  held: TValue | undefined
): TValue | undefined {
  if (!isOffered) return held;
  return submitted;
}

/** One schedule member, kept only while there is a consolidated invoice to schedule. */
function whileConsolidated<TValue>(
  isConsolidated: boolean,
  value: TValue | undefined
): TValue | undefined {
  if (!isConsolidated) return undefined;
  return value;
}

export const useMockBillingSettings = defineMockFacade(
  (data): MockBillingSettingsView => ({
    settings: data.billingSettings,
    priceLists: data.priceLists
  }),
  data => ({
    /**
     * Saves the whole settings page. The consolidation schedule is CLEARED
     * where consolidation is not on: a rule standing under a disabled
     * preference is a fact about a form that was left open, not about how
     * this client is billed.
     */
    save: (
      model: FormModel
    ): MockActionReceipt<MockBillingSettings> | undefined => {
      const settings = data.billingSettings;
      const priceListId = submittedOptional(model, "priceListId");
      // A list the dataset does not hold names no price list at all, which is
      // the standing not-found answer rather than a refusal of its own.
      if (
        priceListId !== undefined &&
        find(data.priceLists, { id: priceListId }) === undefined
      ) {
        return undefined;
      }

      const consolidation = submittedConsolidation(
        model,
        settings.consolidation
      );
      const isConsolidated =
        consolidation === InvoiceConsolidationTypes.ENABLED;
      assign(settings, {
        currency: submittedOptional(model, "currencyCode") ?? settings.currency,
        // A control the brand does not offer is not a field the client
        // cleared: the schema never rendered it, so an absent key means the
        // preference on file stands (`offersPaymentCurrency`, the same fact
        // the schema gates on).
        paymentCurrency: whileOffered(
          offersPaymentCurrency(data),
          submittedOptional(model, "paymentCurrencyCode"),
          settings.paymentCurrency
        ),
        priceListId: whileOffered(
          offersPriceList(data),
          priceListId,
          settings.priceListId
        ),
        consolidation,
        rule: whileConsolidated(
          isConsolidated,
          submittedRule(model, settings.rule)
        ),
        dayOfWeek: whileConsolidated(
          isConsolidated,
          submittedOptional(model, "dayOfWeek")
        ),
        dayOfMonth: whileConsolidated(
          isConsolidated,
          submittedNumber(model, "dayOfMonth")
        ),
        dueDateDay: whileConsolidated(
          isConsolidated,
          submittedNumber(model, "dueDateDay")
        )
      });
      return { ok: true, entity: settings };
    }
  })
);
