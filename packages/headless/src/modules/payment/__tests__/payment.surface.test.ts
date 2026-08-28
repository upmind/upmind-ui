// -----------------------------------------------------------------------------
/**
 * @fileoverview payment public surface — one door, nothing inert, no actor knob
 * (unit, AC-12/AC-13/AC-17/AC-18)
 *
 * ## Job To Be Done
 * AC-12 says everywhere in the product that takes a payment goes in by this
 * module's published surface and nothing reaches inside by another route, so the
 * barrel's runtime export set is pinned exactly and every internal the module
 * has — mappers, utils, services, renderers — is asserted ABSENT from it.
 *
 * AC-13 says nothing is offered that has no effect. This is the FE-2824 question
 * at surface altitude: every one of the ten members is asserted to be a real
 * callable or a live reactive reference, and `context` is asserted to actually
 * carry the order it was asked to pay rather than being an empty ref.
 *
 * AC-17 and AC-18 say a member of staff has no order of their own to pay here
 * and cannot take a payment on a client's behalf — "this simply is not something
 * I can ask for". The proof is the shape of the door: `usePayment` takes ONE
 * argument, an order and a method, and the value it returns carries no actor or
 * on-behalf-of control at all. Per the feature's G3 note, whether the legacy
 * portal allows a staff-taken payment is recorded as UNVERIFIED and owed — this
 * file asserts only what this module's surface offers, never that the capability
 * is absent by design.
 *
 * ## What Breaks If These Fail
 * A consumer reaches past the barrel into a mapper or a service and the module
 * can never be refactored; a caller binds to an advertised member that is
 * permanently undefined and never learns which order it is paying; or a staff
 * actor silently acquires a payment path nobody proved.
 */

import { describe, expect, it } from "vitest";
import "./mocks";
import { GatewayTypes } from "@upmind-automation/types";
import * as payment from "..";
import { usePayment } from "..";
import type { PaymentArgs } from "../payment.types";

// -----------------------------------------------------------------------------

/** Every value (non-type) export the barrel publishes — and nothing else. */
const EXPECTED_RUNTIME_EXPORTS = ["paymentMachine", "usePayment"];

/** Internals the Module Visibility Law keeps private. */
const EXPECTED_ABSENT_EXPORTS = [
  "mapApproval",
  "mapRenderer",
  "hasRenderer",
  "submitViaForm",
  "services",
  "renderers"
];

/** The ten members `usePayment` advertises, per its published JSDoc. */
const ADVERTISED_MEMBERS = [
  "isReady",
  "meta",
  "context",
  "errors",
  "payment",
  "pay",
  "refresh",
  "renderChallenge",
  "completeChallenge",
  "cancelChallenge"
];

function instance() {
  return usePayment({
    orderId: "order-mine-0001",
    paymentDetail: {
      gateway_id: "gateway-0001",
      type: GatewayTypes.CREDITCARD
    } as PaymentArgs["paymentDetail"]
  });
}

/** A member does something if it is a callable or a live reactive reference. */
function isLive(member: unknown): boolean {
  if (typeof member === "function") return true;
  return !!member && typeof member === "object" && "value" in member;
}

// -----------------------------------------------------------------------------

describe("payment barrel — one door in (AC-12)", () => {
  it("publishes exactly the two runtime members the module owns", () => {
    expect(Object.keys(payment).sort()).toEqual(EXPECTED_RUNTIME_EXPORTS);
  });

  it("reaches nothing inside the module by another route", () => {
    const leaked = EXPECTED_ABSENT_EXPORTS.filter(name => name in payment);

    expect(leaked).toEqual([]);
  });
});

describe("usePayment — nothing offered that has no effect (AC-13)", () => {
  it("advertises exactly the ten members its published contract names", () => {
    expect(Object.keys(instance()).sort()).toEqual(
      [...ADVERTISED_MEMBERS].sort()
    );
  });

  it("gives every method it advertises a real callable", () => {
    const live = instance();
    const methods = [
      "isReady",
      "pay",
      "refresh",
      "renderChallenge",
      "completeChallenge",
      "cancelChallenge"
    ];

    expect(
      methods.filter(
        name => typeof (live as Record<string, unknown>)[name] !== "function"
      )
    ).toEqual([]);
  });

  it("gives every state member it advertises a live reactive reference", () => {
    const live = instance();

    expect(isLive(live.meta)).toBe(true);
    expect(isLive(live.errors)).toBe(true);
    expect(isLive(live.context)).toBe(true);
    expect(isLive(live.payment)).toBe(true);
  });

  it("AC-13 hands a reader the order it was asked to pay, not an empty context", () => {
    const live = instance();

    expect(live.context.value?.orderId).toBe("order-mine-0001");
    expect(live.context.value?.paymentDetail.gateway_id).toBe("gateway-0001");
  });
});

describe("usePayment — no actor knob on the door (AC-17, AC-18)", () => {
  it("takes one argument only: which order, and how to pay it", () => {
    expect(usePayment).toHaveLength(1);
  });

  it("offers no actor selector and no on-behalf-of control", () => {
    const live = instance() as Record<string, unknown>;
    const scopeControls = ["as", "for", "actor", "scope", "onBehalfOf"];

    expect(scopeControls.filter(name => name in live)).toEqual([]);
  });

  it("names no actor in the arguments a client supplies", () => {
    const supplied = {
      orderId: "order-mine-0001",
      paymentDetail: {} as PaymentArgs["paymentDetail"]
    };

    expect(Object.keys(supplied).sort()).toEqual(["orderId", "paymentDetail"]);
  });
});
