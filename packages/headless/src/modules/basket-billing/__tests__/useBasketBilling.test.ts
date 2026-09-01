/**
 * @fileoverview useBasketBilling — the UI ↔ billing-machine API contract (unit)
 *
 * ## Job To Be Done
 * Prove the composable a checkout form binds to sends the right event for each
 * intent (set without commit, commit, clear, wait/resume), surfaces a failed
 * commit to the caller, and derives its readiness/validity/dirtiness and its
 * required-field flags from the actor. The real transitions are the machine
 * test's job; here the machine is a parked double. Assertions derive from
 * basket-billing.feature @layer-unit AC-1, AC-3..AC-7.
 *
 * ## What Breaks If These Fail
 * A form quietly commits when the customer only set a field, a declined commit
 * is swallowed, a cleared basket keeps billing, or the form shows the wrong
 * required fields / a stale saved snapshot.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBasketBilling } from "../useBasketBilling";
import { spawnBilling } from "./billing.doubles";
import { DetailedError } from "../../../utils";
import type { UseActor } from "../../../utils";

const holder = vi.hoisted(() => ({ billing: undefined as unknown }));

vi.mock("../../basket", () => ({
  useBasket: () => ({ actors: { billing: holder.billing } })
}));
vi.mock("../../system-localisation", () => ({
  useI18n: () => ({ t: (key: string) => key })
}));
vi.mock("../unified/useUnified", () => ({ useUnified: vi.fn() }));

// -----------------------------------------------------------------------------

function mount(
  state: string | Record<string, string> = "subscribing",
  context: Record<string, unknown> = {}
) {
  const double = spawnBilling(state, context);
  holder.billing = double.actor as unknown as UseActor;
  return { billing: useBasketBilling(), ...double };
}

// -----------------------------------------------------------------------------

describe("useBasketBilling — the send contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-1 sends SET with the model and requests no update", () => {
    const { billing, send } = mount();
    const model = { addressId: "addr-1" };

    billing.set(model);

    expect(send).toHaveBeenCalledWith({ type: "SET", data: model });
    expect(send).not.toHaveBeenCalledWith(
      expect.objectContaining({ update: true })
    );
  });

  it("AC-4 sends CLEAR to discard the stored model", () => {
    const { billing, send } = mount();

    billing.clear();

    expect(send).toHaveBeenCalledWith({ type: "CLEAR" });
  });

  it("AC-5 sends WAIT to pause and RESUME to resume validation", async () => {
    const paused = mount({ available: "valid" });
    await paused.billing.wait(true);
    expect(paused.send).toHaveBeenCalledWith({ type: "WAIT" });

    const resumed = mount({ available: "valid" });
    await resumed.billing.wait(false);
    expect(resumed.send).toHaveBeenCalledWith({ type: "RESUME" });
  });
});

describe("useBasketBilling — committing and surfacing failure", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-3 commits with update and surfaces the actor's error to the caller", async () => {
    const { billing, send } = mount("error", {
      error: { message: "declined" }
    });

    await expect(
      billing.update({ addressId: "addr-1" })
    ).rejects.toBeInstanceOf(DetailedError);
    expect(send).toHaveBeenCalledWith({
      type: "SET",
      data: { addressId: "addr-1" },
      update: true
    });
  });
});

describe("useBasketBilling — reading readiness and requirements", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-6 reports availability, validity, dirtiness and required fields", () => {
    const { billing } = mount(
      { available: "valid" },
      {
        model: { addressId: "addr-1" },
        baseModel: { addressId: "addr-0" },
        config: {
          requiresAddress: true,
          requiresCompany: false,
          requiresPhone: true
        }
      }
    );

    const meta = billing.meta.value;
    expect(meta.isAvailable).toBe(true);
    expect(meta.isValid).toBe(true);
    expect(meta.isDirty).toBe(true);
    expect(meta.needsAddress).toBe(true);
    expect(meta.needsCompany).toBe(false);
    expect(meta.needsPhone).toBe(true);
  });

  it("AC-7 captures the persisted base model as the initial snapshot", () => {
    const baseModel = {
      addressId: "addr-base",
      companyId: null,
      phoneId: null
    };
    const { billing } = mount({ available: "valid" }, { baseModel });

    expect(billing.captureInitialBilling()).toEqual(baseModel);
  });

  it("resolves readiness once the actor leaves its loading states", async () => {
    const { billing } = mount({ available: "valid" });

    await expect(billing.isReady()).resolves.toBe(true);
  });
});
