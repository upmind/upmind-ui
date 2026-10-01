/**
 * @fileoverview affiliate.types — the scope-matrix context probe
 *
 * ## Job To Be Done
 * Protect the module's actor boundary at its root: every cell of both scope
 * matrices is `null as never` (design.md §5.2, D-16), so `.for(actor, id)`
 * has no context to construct against on any actor, including CLIENT — a
 * cell holds the CONTEXTS an actor may act for, not the actor's right to
 * call, and the module refuses a wrong actor at run time, never by
 * advertising an on-behalf capability that does not exist. Refusal is
 * proved twice: the matrix data holds `null` for every cell, and `.for(...)`
 * itself fails to compile on the two composables that carry these matrices
 * (design.md §5.2, "What a matrix cell means").
 *
 * ## What Breaks If These Fail
 * A non-null CLIENT cell would let `.for(CLIENT, someId)` compile, publicly
 * advertising an on-behalf capability the oracle never grants — a client
 * acting on another client's affiliate account, or a guest acting on
 * another visitor's link visit.
 */
import { describe, it, expect } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  CLIENT_AFFILIATE_SCOPE_MATRIX,
  AFFILIATE_LINK_VISIT_SCOPE_MATRIX
} from "../affiliate.types";
import type { useAffiliateLinkVisit } from "../useAffiliateLinkVisit";
import type { useClientAffiliate } from "../useClientAffiliate";

/**
 * Never called at runtime — a COMPILE-TIME-ONLY probe (design.md "Scenarios
 * Deferred to Lower Layers": "a compile fact"). `@ts-expect-error` still gates
 * the type at `tsc`/`vue-tsc` time; wrapping it in an uncalled function keeps
 * it from building a real composable or invoking `.for(...)` at runtime with
 * no seeded session (AC35's run-time refusal is the integration layer's job).
 */
function clientAffiliateForNeverCompiles(
  affiliate: ReturnType<typeof useClientAffiliate>
): void {
  // @ts-expect-error — the CLIENT cell is `null as never`; `.for()` has no context to build.
  affiliate.as(ScopeActorTypes.CLIENT).for(ScopeActorTypes.CLIENT, "any-id");
}

/** Never called at runtime — a compile-time-only probe. See above. */
function linkVisitForNeverCompiles(
  visit: ReturnType<typeof useAffiliateLinkVisit>
): void {
  // @ts-expect-error — every cell is `null as never`; `.for()` has no context to build.
  visit.as(ScopeActorTypes.GUEST).for(ScopeActorTypes.GUEST, "any-id");
}

describe("affiliate.types — CLIENT_AFFILIATE_SCOPE_MATRIX", () => {
  it("holds a null context for every actor, including CLIENT", () => {
    expect([
      CLIENT_AFFILIATE_SCOPE_MATRIX[ScopeActorTypes.CLIENT],
      CLIENT_AFFILIATE_SCOPE_MATRIX[ScopeActorTypes.STAFF],
      CLIENT_AFFILIATE_SCOPE_MATRIX[ScopeActorTypes.GUEST],
      CLIENT_AFFILIATE_SCOPE_MATRIX[ScopeActorTypes.SELF]
    ]).toEqual([null, null, null, null]);
  });

  // `clientAffiliateForNeverCompiles` above is the whole proof for this cell:
  // a compile-time-only `@ts-expect-error` probe (`tsconfig.testcheck.json`
  // gates it at `tsc`/`vue-tsc` time). No runtime `it()` can assert a compile
  // fact — `typeof fn === "function"` is true of ANY function declaration and
  // would stay true even with the `@ts-expect-error` line deleted, so it is
  // not written here. Referenced only so the compiler keeps checking it as
  // live code.
  void clientAffiliateForNeverCompiles;
});

describe("affiliate.types — AFFILIATE_LINK_VISIT_SCOPE_MATRIX", () => {
  it("holds a null context for every actor, including CLIENT", () => {
    expect([
      AFFILIATE_LINK_VISIT_SCOPE_MATRIX[ScopeActorTypes.CLIENT],
      AFFILIATE_LINK_VISIT_SCOPE_MATRIX[ScopeActorTypes.STAFF],
      AFFILIATE_LINK_VISIT_SCOPE_MATRIX[ScopeActorTypes.GUEST],
      AFFILIATE_LINK_VISIT_SCOPE_MATRIX[ScopeActorTypes.SELF]
    ]).toEqual([null, null, null, null]);
  });

  // See the note above `clientAffiliateForNeverCompiles`'s describe block —
  // `linkVisitForNeverCompiles` is the same compile-time-only proof, and gets
  // no runtime `it()` for the same reason.
  void linkVisitForNeverCompiles;
});
