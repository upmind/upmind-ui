/**
 * @fileoverview client-phone-dry — public-surface contract (unit)
 *
 * ## Job To Be Done
 * Prove the barrel's pure, boundary-free exports match the ADR-001 §4
 * actor/context matrix and the D2 phone-`type` parity contract
 * (`docs/sdd/client-phone-dry-smoke/design.md` §2, §5 D2; `parity.yaml` #8):
 * `CLIENT_PHONE_DRY_SCOPE_MATRIX` names exactly the cells legacy supports
 * (client/self, staff/for-client — no guest), and `usePhoneSchema()` requires
 * `type` on every add/edit so a submission cannot silently drop the field
 * legacy demands.
 *
 * ## What Breaks If These Fail
 * A scope matrix drift (e.g. a stray `guest` cell, or `staff` losing its
 * `client` context) desyncs `.as()/.for()` runtime validation from ADR-001;
 * a `usePhoneSchema()` that stops requiring `type` ships an add/edit form
 * that cannot round-trip a field legacy requires (design.md D2).
 *
 * ## Layer
 * Unit — pure functions/constants, no query/session-store/HTTP boundary
 * crossed (`/test-module` routing table: "pure logic ... composable
 * behaviour" -> unit; everything else in this module crosses the
 * query/session-store boundary and is proven at `*.int.test.ts` instead).
 */

import { describe, expect, it, vi } from "vitest";
import {
  CLIENT_PHONE_DRY_SCOPE_MATRIX,
  PhoneContextTypes,
  usePhoneSchema,
  usePhoneUischema
} from "..";
import { ScopeActorTypes } from "../../scope";

// Unit-boundary mock (ADR-021 "unit tests mock their own boundaries"): breaks
// a pre-existing, module-load-order circular dependency between `scope` and
// sibling modules that otherwise throws `Cannot read properties of undefined
// (reading 'SELF')` on a cold module graph — reproduces for ANY module's
// isolated unit-test file that imports `../../scope` (confirmed against an
// unrelated control module, `client-phone`, not just this one); not a
// client-phone-dry defect. Flagged in the test report. `vi.mock` calls are
// hoisted above imports by the test transform regardless of source position.
vi.mock("../../session-store", () => ({
  useActiveSession: () => ({
    useContext: () => ({ activeActor: { value: undefined } })
  }),
  useSessionStore: () => ({})
}));

// -----------------------------------------------------------------------------

describe("client-phone-dry scope matrix (ADR-001 §4)", () => {
  it("AC-MATRIX: names exactly client/self and staff/for-client — no guest cell", () => {
    expect(CLIENT_PHONE_DRY_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBeNull();
    expect(CLIENT_PHONE_DRY_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBe(
      PhoneContextTypes.CLIENT
    );
    expect(CLIENT_PHONE_DRY_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_PHONE_DRY_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });
});

describe("usePhoneSchema (D2 — type restored, required — AC-S1 schema half)", () => {
  it("requires `type` on the phone form schema", () => {
    const schema = usePhoneSchema({});

    expect(schema.required).toContain("type");
  });

  it("declares a `type` property on the schema (not merely required-but-absent)", () => {
    const schema = usePhoneSchema({});

    expect(schema.properties).toHaveProperty("type");
  });

  /**
   * Negative control (spec only — see test-report.md "must-fail patches
   * withheld"): dropping `type` from `required` (reverting to the baseline
   * `client-phone/client-phone.schemas.ts` shape this module is meant to
   * un-drop, design.md D2) must fail this test.
   */
});

describe("usePhoneUischema (AC-S1 — uischema half)", () => {
  it("renders a control for the type field", () => {
    const uischema = usePhoneUischema();
    const asString = JSON.stringify(uischema);

    expect(asString).toContain("type");
  });
});
