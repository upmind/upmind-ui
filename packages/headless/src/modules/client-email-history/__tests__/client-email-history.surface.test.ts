// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the public barrel's full shape (AC-20),
 * and the leaf-record context it no longer carries (FE-3095)
 *
 * ## Job To Be Done
 * Assert every named export the barrel (`index.ts`) carries — both
 * composables, the COLLECTION's scope matrix and context enum, the sortable-
 * properties enum, `SentEmailStatus`, and the sub-composable type-only
 * exports (compile-time only, so asserted via `expectTypeOf` rather than a
 * runtime presence check). This is the GENERAL shape proof (parity M1); the
 * two narrow, colocated `*.single-amputation.test.ts` /
 * `*.sort-enum.test.ts` files each target exactly what their own
 * `.must-fail.patch` removes.
 *
 * The single read carries NO context enum and NO scope matrix (FE-3095): which
 * email is read is a record id handed to the builder's `.withId(id)`, not an
 * entity the actor acts upon. The absence is asserted here as a positive
 * claim, read off the real module namespace — a re-minted
 * `ReceivedEmailContextTypes` / `RECEIVED_EMAIL_SCOPE_MATRIX` turns this red
 * rather than passing unnoticed as it did before.
 */

import { describe, expect, expectTypeOf, it } from "vitest";
import * as barrel from "..";
import {
  RECEIVED_EMAILS_SCOPE_MATRIX,
  ReceivedEmailsContextTypes,
  ReceivedEmailsSortableProperties,
  SentEmailStatus,
  useClientReceivedEmail,
  useClientReceivedEmails
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
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

  it("exports the collection's scope matrix with only CLIENT resolving", () => {
    expect(RECEIVED_EMAILS_SCOPE_MATRIX.client).toBe(
      ReceivedEmailsContextTypes.CLIENT
    );
    expect(RECEIVED_EMAILS_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(RECEIVED_EMAILS_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
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

describe("client-email-history barrel — the single read declares no leaf-record context (FE-3095)", () => {
  it("offers no ReceivedEmailContextTypes and no RECEIVED_EMAIL_SCOPE_MATRIX", () => {
    // A leaf record is not an ADR-001 context type. These two names WERE minted
    // here and deleted; a module offering them again has re-minted the fiction.
    expect(barrel).not.toHaveProperty("ReceivedEmailContextTypes");
    expect(barrel).not.toHaveProperty("RECEIVED_EMAIL_SCOPE_MATRIX");
  });

  it("advertises no single-read scope matrix on the composable itself", () => {
    // `createScopedComposable` carries a module's matrix onto the returned
    // composable as a VALUE — `useClientEmails.scopeMatrix` is the live receipt
    // that the mechanism is wired and used — and that value is what the
    // acting-for picker reads. The single read passes none, so it advertises
    // none.
    expect(useClientReceivedEmail.scopeMatrix).toBeUndefined();
  });

  it("names the record with .withId, at every builder position", () => {
    expect(typeof useClientReceivedEmail().withId).toBe("function");
    expect(
      typeof useClientReceivedEmail().as(ScopeActorTypes.CLIENT).withId
    ).toBe("function");
  });
});
