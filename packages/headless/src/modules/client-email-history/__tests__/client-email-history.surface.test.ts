// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the public barrel's full shape (AC-20)
 *
 * ## Job To Be Done
 * Assert every named export the barrel (`index.ts`) carries — both
 * composables, both scope matrices and their context enums, the sortable-
 * properties enum, `SentEmailStatus`, and the sub-composable type-only
 * exports (compile-time only, so asserted via `expectTypeOf` rather than a
 * runtime presence check). This is the GENERAL shape proof (parity M1); the
 * two narrow, colocated `*.single-amputation.test.ts` /
 * `*.sort-enum.test.ts` files each target exactly what their own
 * `.must-fail.patch` removes.
 */

import { describe, expect, expectTypeOf, it } from "vitest";
import {
  RECEIVED_EMAIL_SCOPE_MATRIX,
  RECEIVED_EMAILS_SCOPE_MATRIX,
  ReceivedEmailContextTypes,
  ReceivedEmailsContextTypes,
  ReceivedEmailsSortableProperties,
  SentEmailStatus,
  useClientReceivedEmail,
  useClientReceivedEmails
} from "..";
import type {
  SentEmail,
  SentEmailModel,
  UseClientReceivedEmail,
  UseClientReceivedEmailActions,
  UseClientReceivedEmailContext,
  UseClientReceivedEmailInternals,
  UseClientReceivedEmailMeta,
  UseClientReceivedEmails,
  UseClientReceivedEmailsActions,
  UseClientReceivedEmailsContext,
  UseClientReceivedEmailsInternals,
  UseClientReceivedEmailsMeta
} from "..";

// -----------------------------------------------------------------------------

describe("client-email-history barrel — every consumer-facing name (AC-20 / parity M1)", () => {
  it("exports both composables as callable functions", () => {
    expect(typeof useClientReceivedEmails).toBe("function");
    expect(typeof useClientReceivedEmail).toBe("function");
  });

  it("exports both scope matrices with only CLIENT resolving", () => {
    expect(RECEIVED_EMAILS_SCOPE_MATRIX.client).toBe(
      ReceivedEmailsContextTypes.CLIENT
    );
    expect(RECEIVED_EMAIL_SCOPE_MATRIX.client).toBe(
      ReceivedEmailContextTypes.EMAIL
    );
  });

  it("exports the sortable-properties enum with the documented default and values", () => {
    expect(ReceivedEmailsSortableProperties.DEFAULT).toBe("created_at");
    expect(ReceivedEmailsSortableProperties.SUBJECT).toBe("subject");
  });

  it("exports SentEmailStatus (re-exported so a consumer needs no direct @upmind-automation/types dependency)", () => {
    expect(SentEmailStatus).toBeDefined();
  });

  it("carries the model and sub-composable type exports at compile time", () => {
    expectTypeOf<SentEmail>().toMatchTypeOf<SentEmailModel>();
    expectTypeOf<UseClientReceivedEmails>().not.toBeAny();
    expectTypeOf<UseClientReceivedEmail>().not.toBeAny();
    expectTypeOf<UseClientReceivedEmailsActions>().not.toBeAny();
    expectTypeOf<UseClientReceivedEmailsContext>().not.toBeAny();
    expectTypeOf<UseClientReceivedEmailsMeta>().not.toBeAny();
    expectTypeOf<UseClientReceivedEmailsInternals>().not.toBeAny();
    expectTypeOf<UseClientReceivedEmailActions>().not.toBeAny();
    expectTypeOf<UseClientReceivedEmailContext>().not.toBeAny();
    expectTypeOf<UseClientReceivedEmailMeta>().not.toBeAny();
    expectTypeOf<UseClientReceivedEmailInternals>().not.toBeAny();
  });
});
