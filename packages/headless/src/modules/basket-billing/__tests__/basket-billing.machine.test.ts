/**
 * @fileoverview billingMachine logic — transitions, guards and context data-flow
 *
 * ## Job To Be Done
 * The billing machine decides when a basket's billing is set without a commit,
 * when a commit fires and settles, where a failed commit lands, how billing is
 * cleared, and how a wait/resume revalidates. Its HTTP services are proven at
 * integration against recorded fixtures; here we double them and assert the
 * LOGIC — the state reached and the model/baseModel captured into context.
 * Assertions derive from basket-billing.feature @layer-unit AC-1..AC-5, AC-7.
 *
 * ## What Breaks If These Fail
 * A customer's chosen billing address is silently committed when they only
 * meant to set it, a real commit never settles, a failed commit is swallowed
 * with no error, cleared billing lingers, or the persisted snapshot the
 * checkout flow reads back is wrong.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMachine, interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import billingMachine from "../billing.machine";
import type { BillingContext } from "../basket-billing.types";

vi.mock("../basket-billing.services", () => ({ default: {} }));
vi.mock("../../feedback", () => ({
  useFeedback: () => ({ addError: vi.fn() })
}));
vi.mock("../../system-localisation", () => ({
  useI18n: () => ({ t: (key: string) => key })
}));

// -----------------------------------------------------------------------------

const READY_CTX = (): BillingContext =>
  ({
    clientId: "client-1",
    basketId: "basket-1",
    model: { addressId: "addr-1", companyId: null, phoneId: null },
    autoupdate: false,
    config: {
      requiresAddress: true,
      requiresCompany: false,
      requiresPhone: false
    }
  }) as unknown as BillingContext;

/** The four services the machine invokes, each resolving by default. */
function services(overrides: Record<string, unknown> = {}) {
  return {
    loadLookups: vi.fn(async () => READY_CTX()),
    parse: vi.fn(async (context: BillingContext) => ({
      model: context.model,
      autoupdate: context.autoupdate
    })),
    validate: vi.fn(async () => true),
    update: vi.fn(async () => ({
      id: "basket-1",
      client_id: "client-1",
      address_id: "addr-2",
      company_id: null,
      phone_id: null
    })),
    ...overrides
  };
}

/**
 * Start the real machine as a CHILD, the way the basket spawns it. The
 * `processed` state notifies its parent, so a parentless interpreter would
 * stall — the harness supplies the parent the machine expects.
 */
function start(
  context: BillingContext = READY_CTX(),
  overrides: Record<string, unknown> = {}
) {
  const svc = services(overrides);

  const child = billingMachine
    .withConfig({ services: svc as never })
    .withContext(context);

  const parent = interpret(
    createMachine({
      predictableActionArguments: true,
      id: "harness",
      initial: "hosting",
      states: { hosting: { invoke: { id: "billing", src: () => child } } },
      on: { "*": { actions: () => undefined } }
    })
  ).start();

  return { service: parent.children.get("billing") as never, svc, parent };
}

const at = (service: {
  getSnapshot: () => { toStrings: () => string[] };
}): string[] => service.getSnapshot().toStrings();

const ctx = (service: {
  getSnapshot: () => { context: BillingContext };
}): BillingContext => service.getSnapshot().context;

// -----------------------------------------------------------------------------

describe("billingMachine — setting billing without a commit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-1 stores a SET model and requests no update while it has no client", () => {
    const { service, svc } = start({} as BillingContext);

    service.send({ type: "SET", data: { addressId: "addr-9" } });

    expect(ctx(service).model).toEqual({ addressId: "addr-9" });
    expect(svc.update).not.toHaveBeenCalled();
    expect(at(service)).toContain("subscribing");
  });
});

describe("billingMachine — committing and settling an update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-2 commits the model to the update service and settles once done", async () => {
    const { service, svc } = start();
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "UPDATE" });
    await waitFor(
      service,
      s => s.matches("processed") || s.matches("complete")
    );

    expect(svc.update).toHaveBeenCalledTimes(1);
    expect(ctx(service).model?.addressId).toBe("addr-2");
  });

  it("AC-7 captures the persisted snapshot as the base model once committed", async () => {
    const { service } = start();
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "UPDATE" });
    await waitFor(
      service,
      s => s.matches("processed") || s.matches("complete")
    );

    expect(ctx(service).baseModel?.addressId).toBe("addr-2");
  });
});

describe("billingMachine — surfacing a failed update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-3 lands in error carrying the fault when the update service rejects", async () => {
    const { service } = start(READY_CTX(), {
      update: vi.fn(async () =>
        Promise.reject({ message: "billing update failed" })
      )
    });
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "UPDATE" });
    await waitFor(service, s => !!s.context.error);

    expect(ctx(service).error).toBeTruthy();
  });
});

describe("billingMachine — clearing billing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-4 discards the stored model on CLEAR", async () => {
    const { service } = start();
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "CLEAR" });

    expect(ctx(service).model).toBeUndefined();
  });
});

describe("billingMachine — refreshing on a basket change", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adopts the new basket and client when the subscribed basket changes", async () => {
    const { service } = start();
    await waitFor(service, s => s.matches("available.valid"));

    service.send({
      type: "REFRESH",
      data: { id: "basket-2", client_id: "client-2" }
    });

    expect(ctx(service).basketId).toBe("basket-2");
    expect(ctx(service).clientId).toBe("client-2");
  });
});

describe("billingMachine — pausing and resuming validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-5 waits, then revalidates the details on resume", async () => {
    const { service, svc } = start();
    await waitFor(service, s => s.matches("available.valid"));
    const validatedOnLoad = svc.validate.mock.calls.length;

    service.send({ type: "WAIT" });
    await waitFor(service, s => s.matches("available.waiting"));

    service.send({ type: "RESUME" });
    await waitFor(service, s => s.matches("available.valid"));

    expect(svc.validate.mock.calls.length).toBeGreaterThan(validatedOnLoad);
  });
});
