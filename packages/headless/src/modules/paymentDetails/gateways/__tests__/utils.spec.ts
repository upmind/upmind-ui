/**
 * @fileoverview canBeStored Utility Tests
 *
 * ## Job To Be Done
 * Validates gateway storage capability detection based on gateway properties.
 * Context-aware filtering (ADD vs PAY) is handled upstream by filterGateways.
 *
 * ## What Breaks If These Fail
 * - Gateways incorrectly marked as storable/non-storable
 * - Users could select a gateway that fails when attempting to store a payment method
 */

import { describe, it, expect } from "vitest";
import { canBeStored } from "../utils";

// --- types
import { GatewayStoreType } from "@upmind-automation/types";
import type { IGateway } from "@upmind-automation/types";

// --- helpers

function makeGateway(overrides: Record<string, any> = {}) {
  return {
    id: "gw-1",
    is_stored: true,
    store_outside_payment: false,
    store_on_payment: false,
    gateway_provider: {
      store_type: GatewayStoreType.EITHER
    },
    ...overrides
  } as unknown as IGateway;
}

// --- tests

describe("canBeStored", () => {
  it("returns false for undefined gateway", () => {
    expect(canBeStored(undefined)).toBe(false);
  });

  it("returns false when is_stored is false", () => {
    expect(canBeStored(makeGateway({ is_stored: false }))).toBe(false);
  });

  it("returns false when store_type is NONE", () => {
    expect(
      canBeStored(
        makeGateway({
          gateway_provider: { store_type: GatewayStoreType.NONE }
        })
      )
    ).toBe(false);
  });

  it("returns true when store_outside_payment is true", () => {
    expect(canBeStored(makeGateway({ store_outside_payment: true }))).toBe(
      true
    );
  });

  it("returns false when store_on_payment is true but store_outside_payment is false", () => {
    expect(
      canBeStored(
        makeGateway({
          store_outside_payment: false,
          store_on_payment: true
        })
      )
    ).toBe(false);
  });

  it("returns true when neither store flag is set (backward compat fallthrough)", () => {
    expect(
      canBeStored(
        makeGateway({
          store_outside_payment: false,
          store_on_payment: false
        })
      )
    ).toBe(true);
  });
});
