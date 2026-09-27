// -----------------------------------------------------------------------------
/**
 * @fileoverview payment-details stored-method schema — the shared pick-list, and
 * the PAY-machine regression guard (unit; ruling R28-D2)
 *
 * ## Job To Be Done
 * Operator decision D2 moved the stored-card pick list and its control OUT of
 * the PAY machine's inline definitions and INTO two exported functions,
 * `useStoredPaymentMethodsSchema` / `useStoredPaymentMethodsUischema`, so the
 * `contract` module can draw its `setPaymentMethod` form from the same source.
 * The reuse is BY IMPORT: the PAY machine's own `useSchemaDefinitions` /
 * `usePayUischemaDefinitions` now call those functions, so — fed the same
 * stored methods — they must still produce the byte-identical
 * `payment_details_id` definition and control they did before the extraction.
 * The exported function itself builds an enum of the stored card ids plus a
 * `null` member, with one labelled option per card (the default card flagged),
 * and a radio control.
 *
 * ## Provenance
 * The stored methods are the recording client's real 13-card spread, read out
 * of this module's own recorded `fixtures/` and mapped through the module's own
 * `mapPaymentDetails` — never a hand-authored card.
 *
 * ## What Breaks If These Fail
 * The extraction silently changes the PAY machine's stored-method form (a
 * regression in the byte-identity guard), or the shared function stops offering
 * a card the client actually holds, or drops the `null`/clear member the schema
 * needs to validate.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  BrandConfigKeys,
  GatewayContext,
  PaymentType
} from "@upmind-automation/types";
import {
  useStoredPaymentMethodsSchema,
  useStoredPaymentMethodsUischema
} from "..";
import { mapPaymentDetails } from "../payment-details.mappers";
import {
  useSchemaDefinitions,
  usePayUischemaDefinitions
} from "../payment-details.schemas";
import type { PaymentDetailsContext } from "../payment-details.types";
import type { IPaymentDetail } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

/** The recording client's real stored methods, mapped by the module's own mapper. */
function storedCards() {
  const body = getFixtureBody<{ data?: unknown }>(
    "get-clients-id-payment-details-active-true-brand-id-country-id",
    { recordingsDir }
  );
  const raw = Object.values(
    (body?.data as Record<string, IPaymentDetail>) ?? {}
  );
  if (!raw.length) {
    throw new Error(
      "Missing fixture. Run `pnpm fixtures:generate payment-details` to capture " +
        "the client's stored methods."
    );
  }
  return mapPaymentDetails(raw as never) as {
    id: string;
    isDefault: boolean;
  }[];
}

const cards = storedCards();

function payContext(): PaymentDetailsContext {
  return {
    ctx: GatewayContext.PAY,
    client: { id: "client-0001" },
    currency: { id: "currency-0001", code: "USD" },
    amount: 50,
    paidAmount: 0,
    raw: {
      config: { [BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED]: true },
      gateways: []
    },
    lookups: {
      amountsFormatted: { amount: "", outstanding: "", wallet: "" },
      gateways: [],
      storedPaymentMethods: cards,
      paymentTypes: {
        PAY_IN_FULL: PaymentType.PAY_IN_FULL,
        PARTIAL_PAYMENT: PaymentType.PARTIAL_PAYMENT
      },
      accountCredit: {
        owned: { value: 0, amount: "" },
        credit: { value: 0, amount: "" },
        total: { value: 0, amount: "" }
      }
    },
    model: { amount: 50, type: PaymentType.PARTIAL_PAYMENT }
  } as unknown as PaymentDetailsContext;
}

// -----------------------------------------------------------------------------

describe("useStoredPaymentMethodsSchema — the shared stored-card pick list (D2)", () => {
  const schema = useStoredPaymentMethodsSchema(cards as never) as {
    type: string[];
    enum: (string | null)[];
    options: { value: string; label: string; isDefault: boolean }[];
  };

  it("offers every stored card id, plus a null member, as its enum", () => {
    for (const card of cards) {
      expect(schema.enum).toContain(card.id);
    }
    expect(schema.enum).toContain(null);
    expect(schema.enum).toHaveLength(cards.length + 1);
    expect(schema.type).toContain("string");
    expect(schema.type).toContain("null");
  });

  it("labels one option per stored card, and flags the client's default card", () => {
    expect(schema.options.map(option => option.value)).toEqual(
      cards.map(card => card.id)
    );
    for (const option of schema.options) {
      expect(option.label).toBeTruthy();
    }
    const defaults = schema.options.filter(option => option.isDefault);
    expect(defaults).toHaveLength(1);
  });
});

describe("useStoredPaymentMethodsUischema — the shared radio control (D2)", () => {
  it("scopes a radio control to the caller's own property and i18n key", () => {
    const control = useStoredPaymentMethodsUischema(
      "#/properties/paymentDetailsId",
      "form.contract_payment_method"
    ) as {
      type: string;
      scope: string;
      i18n: string;
      options: { format: string };
    };

    expect(control.type).toBe("Control");
    expect(control.scope).toBe("#/properties/paymentDetailsId");
    expect(control.i18n).toBe("form.contract_payment_method");
    expect(control.options.format).toBe("radio");
  });
});

describe("the PAY machine still produces the identical definition and control (D2 regression guard)", () => {
  it("useSchemaDefinitions().payment_details_id is byte-identical to the shared schema", () => {
    const defs = useSchemaDefinitions(payContext()) as Record<string, unknown>;

    expect(defs.payment_details_id).toEqual(
      useStoredPaymentMethodsSchema(cards as never)
    );
  });

  it("usePayUischemaDefinitions()'s payment_details_id control is the shared radio control", () => {
    const controls = usePayUischemaDefinitions(payContext()) as {
      scope?: string;
    }[];
    const control = controls.find(
      entry => entry.scope === "#/properties/payment_details_id"
    );

    expect(control).toEqual(
      useStoredPaymentMethodsUischema(
        "#/properties/payment_details_id",
        "form.payment_details_id"
      )
    );
  });
});
