// -----------------------------------------------------------------------------
/**
 * @fileoverview payment mappers — the bank-confirmation and provider-step
 * lookups (unit, AC-3/AC-5/AC-8)
 *
 * ## Job To Be Done
 * AC-5 says a client whose bank wants confirmation "is given what I need in
 * order to confirm it". The only thing the wire gives is
 * `IPaymentAttempt.approval_url`; the only thing the module's context offers a
 * consumer is `PaymentContext["approval"]`. {@link mapApproval} is the whole of
 * that translation, so these tests pin it against the two types — not against
 * how it happens to be written.
 *
 * AC-3 and AC-8 say the provider behind the chosen method handles the payment,
 * that a provider running its confirmation step "in its own way" takes the
 * client through that step, and that a provider with no step of its own still
 * confirms in the ordinary way. {@link mapRenderer} and {@link hasRenderer} are
 * the lookup that decides which of those two a client gets, so the tests assert
 * both answers exist and that the two functions never disagree.
 *
 * ## Data provenance, stated not implied
 * The last test reads a REAL recorded approval — the PayPal sandbox
 * `approval_url` captured by `pnpm fixtures:generate payment` — so the mapper is
 * proven against a body a provider actually returned. The edge cases above it
 * (no approval, no attempt, no fields) are shapes `IPaymentAttempt` permits that
 * no single recording carries, built from the published type and NOT presented
 * as recorded. No fixture file is authored to stand in for a capture.
 *
 * ## What Breaks If These Fail
 * A client is handed a confirmation with the wrong destination, method, or a
 * missing field and the bank refuses it; or a MercadoPago client is dropped
 * into the generic redirect that provider does not support, and cannot pay.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { GatewayProviderCodes, Methods } from "@upmind-automation/types";
import { hasRenderer, mapApproval, mapRenderer } from "../payment.mappers";
import type {
  IPaymentAttempt,
  TransactionStatus
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/** The three parts `PaymentContext["approval"]` is made of, per the types. */
const APPROVAL = {
  fields: { MD: "merchant-data-123", PaReq: "pa-request-blob" },
  method: Methods.POST,
  url: "https://3ds.provider.test/authenticate"
};

/** A wire attempt shaped by `IPaymentAttempt`, with or without an approval. */
function attempt(approvalUrl?: IPaymentAttempt["approval_url"]) {
  return {
    approval_url: approvalUrl,
    transaction_id: "txn-1",
    transaction_status: "3D-AUTH" as TransactionStatus,
    transaction_type: "PAYMENT"
  } as NonNullable<Parameters<typeof mapApproval>[0]>;
}

/** Every provider code the platform publishes. */
const ALL_PROVIDERS = Object.values(GatewayProviderCodes);

const recordingsDir = join(import.meta.dirname, "fixtures");

/** The approval a real provider returned, off the recorded charge. */
function recordedAttempt(): NonNullable<Parameters<typeof mapApproval>[0]> {
  return getFixtureBody<{
    data: NonNullable<Parameters<typeof mapApproval>[0]>;
  }>("post-payments-case-taken-up-paypal-express", { recordingsDir }).data;
}

// -----------------------------------------------------------------------------

describe("mapApproval — what the client needs to confirm with the bank (AC-5)", () => {
  it("carries the destination, the method and every field off the wire attempt", () => {
    expect(mapApproval(attempt(APPROVAL))).toEqual(APPROVAL);
  });

  it("yields nothing to confirm when the attempt needs no bank confirmation", () => {
    expect(mapApproval(attempt(undefined))).toBeUndefined();
  });

  it("yields nothing when there is no attempt at all", () => {
    expect(mapApproval(undefined)).toBeUndefined();
  });

  it("keeps a field-less approval usable rather than collapsing it", () => {
    const bare = { ...APPROVAL, fields: {} };

    expect(mapApproval(attempt(bare))).toEqual(bare);
  });

  it("moves a REAL recorded provider's query string into form fields, losing nothing", () => {
    const wire = recordedAttempt();
    const recorded = new URL(wire.approval_url?.url ?? "");
    const mapped = mapApproval(wire);

    // `submitViaForm` hands off by building a form, so a query string has to
    // become hidden inputs — left on the action it would survive a GET but be
    // dropped by a POST. Every recorded param is asserted to have made the move.
    expect(mapped?.url).toBe(`${recorded.origin}${recorded.pathname}`);
    expect(mapped?.method).toBe(wire.approval_url?.method);
    expect(mapped?.fields).toEqual(
      Object.fromEntries(recorded.searchParams.entries())
    );
    expect(Object.keys(mapped?.fields ?? {})).toContain("token");
  });
});

describe("mapRenderer / hasRenderer — whose confirmation step a client gets (AC-3, AC-8)", () => {
  it("AC-8 gives MercadoPago its own confirmation step", () => {
    const config = mapRenderer(GatewayProviderCodes.MERCADO_PAGO);

    expect(hasRenderer(GatewayProviderCodes.MERCADO_PAGO)).toBe(true);
    expect(typeof config?.render).toBe("function");
  });

  it("AC-8 leaves a provider with no step of its own to the ordinary route", () => {
    expect(hasRenderer(GatewayProviderCodes.OFFLINE)).toBe(false);
    expect(mapRenderer(GatewayProviderCodes.OFFLINE)).toBeUndefined();
  });

  it("AC-3 answers for every published provider, and never disagrees with itself", () => {
    const disagreements = ALL_PROVIDERS.filter(
      code => hasRenderer(code) !== (mapRenderer(code) !== undefined)
    );

    expect(disagreements).toEqual([]);
  });

  it("AC-3 offers a step to some providers and not to others", () => {
    const withStep = ALL_PROVIDERS.filter(code => hasRenderer(code));

    expect(withStep.length).toBeGreaterThan(0);
    expect(withStep.length).toBeLessThan(ALL_PROVIDERS.length);
  });

  it("treats an unknown provider code as having no step of its own", () => {
    expect(hasRenderer("NotAGateway" as GatewayProviderCodes)).toBe(false);
    expect(mapRenderer("NotAGateway" as GatewayProviderCodes)).toBeUndefined();
  });
});
