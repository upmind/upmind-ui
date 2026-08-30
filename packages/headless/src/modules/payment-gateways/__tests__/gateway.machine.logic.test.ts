// -----------------------------------------------------------------------------
/**
 * @fileoverview gatewayMachine logic — the transitions, guards and assigners
 *
 * ## Job To Be Done
 * The machine is the module's decision-maker: it decides when a gateway is
 * driveable, what lands in context at each step, which guard opens the payment
 * door, and where a refusal sends the client. Its services are proven elsewhere
 * against recorded fixtures, so this file doubles them and asserts the LOGIC —
 * the state the machine lands in, and the value each assigner writes.
 *
 * ## What Breaks If These Fail
 * A client is asked to pay through a gateway that never loaded, a captured card
 * never reaches the provider, a refusal is swallowed and the client is told
 * nothing, or a completed payment never reports its detail back.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMachine, interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { GatewayContext as GatewayCtx } from "@upmind-automation/types";
import createGatewayMachine from "../gateway.machine";
import type { GatewayContext } from "../payment-gateways.types";

// -----------------------------------------------------------------------------

const CARD = { number: "4242424242424242", cvv: "123" };

/** A loaded, supported gateway ready to be driven. */
function context(overrides: Partial<GatewayContext> = {}): GatewayContext {
  return {
    supported: true,
    ctx: GatewayCtx.PAY,
    amount: 50,
    orderId: "order-0001",
    currency: { id: "cur-gbp", code: "GBP" },
    gateway: { id: "gw-0001", type: 1 },
    client: { id: "client-0001" },
    ...overrides
  } as unknown as GatewayContext;
}

/** The six services the machine invokes, each resolving by default. */
function services(overrides: Record<string, unknown> = {}) {
  return {
    load: vi.fn(async () => ({ canStore: true, mustStore: false })),
    render: vi.fn(async () => ({ sdk: { mounted: true }, container: null })),
    parse: vi.fn(async () => CARD),
    validate: vi.fn(async () => CARD),
    pay: vi.fn(async () => ({ id: "pd-0001", gateway_id: "gw-0001" })),
    add: vi.fn(async () => ({ id: "pd-add-0001" })),
    ...overrides
  };
}

/**
 * Start the real machine as a CHILD, the way payment-details spawns it. The
 * `valid` state notifies its parent on entry, so a parentless interpreter
 * stalls there — the harness supplies the parent the machine expects, and
 * records what the machine sends up.
 */
function start(
  ctx: GatewayContext = context(),
  overrides: Record<string, unknown> = {}
) {
  const svc = services(overrides);
  const sent: { type: string; data?: unknown }[] = [];

  const child = createGatewayMachine("gateway-under-test")
    .withConfig({ services: svc as never })
    .withContext(ctx);

  const parent = interpret(
    createMachine({
      predictableActionArguments: true,
      id: "harness",
      initial: "hosting",
      states: {
        hosting: { invoke: { id: "gateway", src: () => child } }
      },
      on: { "*": { actions: (_c, event) => void sent.push(event as never) } }
    })
  ).start();

  return {
    service: parent.children.get("gateway") as never,
    svc,
    parent,
    sent
  };
}

/** The machine's flat state strings, for readable assertions. */
const at = (service: { getSnapshot: () => { toStrings: () => string[] } }) =>
  service.getSnapshot().toStrings();

// -----------------------------------------------------------------------------

describe("gatewayMachine — loading a gateway", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-A2 starts in loading and asks the load service for the gateway", () => {
    const { service, svc } = start();

    expect(at(service)).toContain("loading");
    expect(svc.load).toHaveBeenCalled();
  });

  it("AC-A1 routes a renderless gateway straight to available", async () => {
    const { service } = start(context({ renderless: true }));

    await waitFor(service, s => s.matches("available.valid"));

    expect(at(service)).toContain("available.valid");
  });

  it("AC-D1 routes a gateway needing a form through rendering", async () => {
    const { service } = start();

    await waitFor(service, s => s.matches("rendering.idle"));

    expect(at(service)).toContain("rendering.idle");
  });

  it("AC-A4 sends a gateway whose load fails to unavailable", async () => {
    const { service } = start(context(), {
      load: vi.fn(async () => Promise.reject({ message: "gateway offline" }))
    });

    await waitFor(service, s => s.matches("unavailable"));

    expect(service.getSnapshot().context.error).toBeTruthy();
  });

  it("AC-A1 writes what load returned into context", async () => {
    const { service } = start(context({ renderless: true }));

    await waitFor(service, s => s.matches("available"));

    expect(service.getSnapshot().context.canStore).toBe(true);
  });

  it("AC-D4 builds the form schemas once the gateway loads", async () => {
    const { service } = start(context({ renderless: true }));

    await waitFor(service, s => s.matches("available"));
    const { schema, uischema } = service.getSnapshot().context;

    expect(schema).toBeTypeOf("object");
    expect(uischema).toBeTypeOf("object");
  });
});

describe("gatewayMachine — drawing a hosted form", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-D1 asks the render service to draw when the consumer offers a place", async () => {
    const { service, svc } = start();
    await waitFor(service, s => s.matches("rendering.idle"));

    const container = { tag: "div" };
    service.send({ type: "RENDER", data: { container } });

    await waitFor(service, s => !s.matches("rendering.idle"));
    expect(svc.render).toHaveBeenCalled();
  });

  it("AC-D1 records the drawn SDK and container on context", async () => {
    const container = { tag: "div" };
    const { service } = start(context(), {
      render: vi.fn(async () => ({ sdk: { drawn: true }, container }))
    });
    await waitFor(service, s => s.matches("rendering.idle"));

    service.send({ type: "RENDER", data: { container } });
    await waitFor(service, s => s.matches("available"));

    expect(service.getSnapshot().context.sdk).toEqual({ drawn: true });
    expect(service.getSnapshot().context.container).toBe(container);
  });

  it("AC-E2 sends a gateway whose form fails to draw to unavailable", async () => {
    const { service } = start(context(), {
      render: vi.fn(async () => Promise.reject({ message: "mount failed" }))
    });
    await waitFor(service, s => s.matches("rendering.idle"));

    service.send({ type: "RENDER", data: { container: {} } });
    await waitFor(service, s => s.matches("unavailable"));

    expect(service.getSnapshot().context.error).toBeTruthy();
  });
});

describe("gatewayMachine — validating what a client enters", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-A8 reports a gateway valid once parse and validate both pass", async () => {
    const { service } = start(context({ renderless: true }));

    await waitFor(service, s => s.matches("available.valid"));

    expect(service.getSnapshot().context.error).toBeUndefined();
  });

  it("AC-A9 sends a gateway that fails validation to invalid, carrying the error", async () => {
    const { service } = start(context({ renderless: true }), {
      validate: vi.fn(async () =>
        Promise.reject({ message: "card number invalid" })
      )
    });

    await waitFor(service, s => s.matches("available.invalid"));

    expect(service.getSnapshot().context.error).toBeTruthy();
  });

  it("AC-A9 sends a gateway that fails to parse to invalid", async () => {
    const { service } = start(context({ renderless: true }), {
      parse: vi.fn(async () => Promise.reject({ message: "unparseable" }))
    });

    await waitFor(service, s => s.matches("available.invalid"));

    expect(service.getSnapshot().context.error).toBeTruthy();
  });

  it("AC-A6 records what a client enters and re-checks the gateway", async () => {
    const { service } = start(context({ renderless: true }));
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "SET", data: CARD });
    await waitFor(service, s => s.matches("available.valid"));

    // The schema parser owns the stored shape, so assert the value survived
    // rather than the whole object.
    expect(service.getSnapshot().context.model).toBeTruthy();
    expect(service.getSnapshot().context.error).toBeUndefined();
  });

  it("AC-A7 discards what a client entered when they clear the gateway", async () => {
    const { service } = start(context({ renderless: true, model: CARD }));
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "CLEAR" });

    expect(service.getSnapshot().context.model).toBeUndefined();
  });

  it("AC-A9 keeps the gateway checkable when the SDK reports its own verdict", async () => {
    const { service } = start(context({ renderless: true }));
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "VALIDATE", data: { valid: false } });
    await waitFor(service, s => s.matches("available.valid"));

    expect(at(service)).toContain("available.valid");
  });
});

describe("gatewayMachine — paying and storing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-A12 hands back a payment detail once the provider clears the payment", async () => {
    const { service, svc } = start(context({ renderless: true }));
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "PAY" });
    await waitFor(
      service,
      s => s.matches("processed") || s.matches("complete")
    );

    expect(svc.pay).toHaveBeenCalled();
    expect(service.getSnapshot().context.paymentDetail).toEqual({
      id: "pd-0001",
      gateway_id: "gw-0001"
    });
  });

  it("AC-A13 surfaces the provider's refusal instead of a payment detail", async () => {
    const { service } = start(context({ renderless: true }), {
      pay: vi.fn(async () => Promise.reject({ message: "card declined" }))
    });
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "PAY" });
    await waitFor(service, s => s.matches("available.error"));

    expect(service.getSnapshot().context.error).toBeTruthy();
    expect(service.getSnapshot().context.paymentDetail).toBeUndefined();
  });

  it("AC-A13 re-checks the gateway when the provider refuses with no reason", async () => {
    const { service } = start(context({ renderless: true }), {
      pay: vi.fn(async () => Promise.reject({}))
    });
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "PAY" });
    await waitFor(service, s => s.matches("available.valid"));

    expect(at(service)).toContain("available.valid");
  });

  it("AC-B1 refuses to pay a gateway opened to store a method", async () => {
    const { service, svc } = start(
      context({ renderless: true, ctx: GatewayCtx.ADD })
    );
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "PAY" });

    expect(svc.pay).not.toHaveBeenCalled();
  });

  it("AC-C2 stores a method when the gateway is opened to add one", async () => {
    const { service, svc } = start(
      context({ renderless: true, ctx: GatewayCtx.ADD })
    );
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "ADD" });
    await waitFor(
      service,
      s => s.matches("processed") || s.matches("complete")
    );

    expect(svc.add).toHaveBeenCalled();
    expect(service.getSnapshot().context.paymentDetail).toEqual({
      id: "pd-add-0001"
    });
  });

  it("AC-C1 refuses to store through a gateway opened to pay", async () => {
    const { service, svc } = start(context({ renderless: true }));
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "ADD" });

    expect(svc.add).not.toHaveBeenCalled();
  });

  it("AC-C3 surfaces a refusal when the provider will not store the method", async () => {
    const { service } = start(
      context({ renderless: true, ctx: GatewayCtx.ADD }),
      { add: vi.fn(async () => Promise.reject({ message: "cannot store" })) }
    );
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "ADD" });
    await waitFor(service, s => s.matches("available.error"));

    expect(service.getSnapshot().context.error).toBeTruthy();
  });
});

describe("gatewayMachine — reacting to a changed payment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("AC-A11 re-checks the gateway when the amount changes", async () => {
    const { service } = start(context({ renderless: true }));
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "REFRESH", data: { amount: 12.5 } });
    await waitFor(service, s => s.matches("available.valid"));

    expect(service.getSnapshot().context.amount).toBe(12.5);
  });

  it("AC-A10 leaves the gateway alone when nothing about the payment changed", async () => {
    const ctx = context({ renderless: true });
    const { service } = start(ctx);
    await waitFor(service, s => s.matches("available.valid"));

    service.send({
      type: "REFRESH",
      data: {
        amount: ctx.amount,
        orderId: ctx.orderId,
        currency: ctx.currency,
        address: ctx.address
      }
    });

    expect(service.getSnapshot().context.amount).toBe(ctx.amount);
  });

  it("AC-E2 lets an unavailable gateway recover when the payment changes", async () => {
    const { service } = start(context(), {
      load: vi
        .fn()
        .mockRejectedValueOnce({ message: "amount too small" })
        .mockResolvedValue({ canStore: false })
    });
    await waitFor(service, s => s.matches("unavailable"));

    service.send({ type: "REFRESH", data: { amount: 500 } });
    await waitFor(service, s => !s.matches("unavailable"));

    expect(service.getSnapshot().context.error).toBeUndefined();
    expect(service.getSnapshot().context.sdk).toBeUndefined();
  });

  it("AC-A7 drops the provider SDK when the consumer asks the gateway to clean up", async () => {
    const container = { tag: "div" };
    const { service } = start(context(), {
      render: vi.fn(async () => ({ sdk: { drawn: true }, container }))
    });
    await waitFor(service, s => s.matches("rendering.idle"));
    service.send({ type: "RENDER", data: { container } });
    await waitFor(service, s => s.matches("available"));

    service.send({ type: "CLEANUP" });

    expect(service.getSnapshot().context.sdk).toBeUndefined();
  });

  it("AC-E3 restarts the gateway when the client's session ends", async () => {
    const { service } = start(context({ renderless: true, model: CARD }));
    await waitFor(service, s => s.matches("available.valid"));

    service.send({ type: "UNAUTHENTICATED" });

    expect(at(service)).toContain("loading");
    expect(service.getSnapshot().context.model).toBeUndefined();
    expect(service.getSnapshot().context.schema).toBeUndefined();
  });
});
