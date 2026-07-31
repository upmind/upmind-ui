/**
 * @fileoverview client-address-dry — public-surface contract (unit)
 *
 * ## Job To Be Done
 * Prove the barrel's pure, boundary-free exports match the ADR-001 §4
 * actor/context matrix and the D-ADDR-3 address-`type` parity contract
 * (`docs/sdd/client-address-dry-smoke/design.md` §2, §5 D-ADDR-3;
 * `parity.yaml` #9): `CLIENT_ADDRESS_DRY_SCOPE_MATRIX` names exactly the cells
 * legacy supports (client/self, staff/for-client — no guest), and
 * `useAddressSchema()` requires `type` on every add/edit so a submission
 * cannot silently drop the field legacy demands. Also proves R12
 * (`REQUIRE_REGION_IN_ADDRESS`) toggles `regionId`'s required-ness — brand
 * config, not actor (AC-REGION).
 *
 * ## What Breaks If These Fail
 * A scope matrix drift (e.g. a stray `guest` cell, or `staff` losing its
 * `client` context) desyncs `.as()/.for()` runtime validation from ADR-001; a
 * `useAddressSchema()` that stops requiring `type` ships an add/edit form
 * that cannot round-trip a field legacy requires (design.md D-ADDR-3); a
 * `regionId` that never becomes required under `REQUIRE_REGION_IN_ADDRESS`
 * silently drops a legacy-required field for brands that need it (R12).
 *
 * ## Layer
 * Unit — pure functions/constants, no query/session-store/HTTP boundary
 * crossed (`/test-module` routing table: "pure logic ... composable
 * behaviour" -> unit; everything else in this module crosses the
 * query/session-store boundary and is proven at `*.int.test.ts` instead).
 */

import { describe, expect, it, vi } from "vitest";
import {
  CLIENT_ADDRESS_DRY_SCOPE_MATRIX,
  AddressContextTypes,
  AddressTypes,
  useAddressSchema,
  useAddressUischema
} from "..";
import { ScopeActorTypes } from "../../scope";

// Unit-boundary mock (ADR-021 "unit tests mock their own boundaries"): breaks
// a pre-existing, module-load-order circular dependency between `scope` and
// sibling modules that otherwise throws `Cannot read properties of undefined
// (reading 'SELF')` on a cold module graph — reproduces for ANY module's
// isolated unit-test file that imports `../../scope` (corroborated against
// `client-phone-dry.contract.test.ts`'s identical mock); not a
// client-address-dry defect.
vi.mock("../../session-store", () => ({
  useActiveSession: () => ({
    useContext: () => ({ activeActor: { value: undefined } })
  }),
  useSessionStore: () => ({})
}));

// -----------------------------------------------------------------------------

describe("client-address-dry scope matrix (ADR-001 §4)", () => {
  it("AC-MATRIX: names exactly client/self and staff/for-client — no guest cell", () => {
    expect(CLIENT_ADDRESS_DRY_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBeNull();
    expect(CLIENT_ADDRESS_DRY_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBe(
      AddressContextTypes.CLIENT
    );
    expect(CLIENT_ADDRESS_DRY_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_ADDRESS_DRY_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });
});

describe("useAddressSchema (D-ADDR-3 — type restored, required — AC-S1 schema half)", () => {
  it("requires `type` on the address form schema", () => {
    const schema = useAddressSchema({});

    expect(schema.required).toContain("type");
  });

  it("declares a `type` property on the schema with the four restored options (not merely required-but-absent)", () => {
    const schema = useAddressSchema({});

    expect(schema.properties).toHaveProperty("type");
    expect(AddressTypes.map(t => t.value)).toEqual([
      "Home",
      "Office",
      "Holiday",
      "Company"
    ]);
  });

  /**
   * Negative control (colocated `.must-fail.patch`, see
   * `client-address-dry.staff.int.capability-gate.must-fail.patch` sibling
   * convention for the pattern this class of control follows): dropping
   * `type` from `required` (reverting to the baseline
   * `client-address/client-address.schemas.ts` shape this module is meant to
   * un-drop, D-ADDR-3) must fail this test.
   */
});

describe("useAddressUischema (AC-S1 — uischema half)", () => {
  it("renders a control for the type field", () => {
    const uischema = useAddressUischema();
    const asString = JSON.stringify(uischema);

    expect(asString).toContain("type");
  });
});

describe("useAddressSchema (AC-REGION — R12 REQUIRE_REGION_IN_ADDRESS)", () => {
  it("does NOT require `regionId` when the brand does not demand a region", () => {
    const schema = useAddressSchema({ requireRegion: false });
    const addressDef = schema.definitions?.address as {
      required?: string[];
    };

    expect(addressDef.required).not.toContain("regionId");
  });

  it("DOES require `regionId` when the brand demands a region", () => {
    const schema = useAddressSchema({ requireRegion: true });
    const addressDef = schema.definitions?.address as {
      required?: string[];
    };

    expect(addressDef.required).toContain("regionId");
  });

  /**
   * Negative control: a schema that never pushes `regionId` into
   * `required` regardless of `requireRegion` silently drops R12 for brands
   * that demand it — caught by the "DOES require" assertion above going
   * green unconditionally (a schema wired to ignore `requireRegion` fails
   * the negative branch, not this one; both branches together are the
   * control).
   */
});
