/**
 * @fileoverview gatewayMachine unit tests — factory, structure and initial state
 *
 * ## Job To Be Done
 * Cells A, B and D of `payment-gateways.feature` promise a lifecycle that every
 * gateway honours: loading, available, processing, processed, complete, plus
 * the failure arms unavailable and available.error. This file imports the REAL
 * `gatewayMachine` and asserts on the state graph structure and initial behavior.
 *
 * ## What Breaks If These Fail
 * The gateway machine has wrong initial state, missing states, or broken
 * event vocabulary that would prevent the payment flow from working.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import {
  GatewayContext as GatewayCtx,
  GatewayStoreType
} from "@upmind-automation/types";
import createGatewayMachine from "../gateway.machine";
import type { GatewayContext } from "../payment-gateways.types";
import type { ICurrency, IGateway, IClient } from "@upmind-automation/types";
import type { Interpreter } from "xstate";

vi.mock("../../brand", () => ({
  useBrand: () => ({
    brandId: { value: "test-brand-id" },
    currency: { value: { id: "test-currency-id", code: "GBP" } },
    currencyId: { value: "test-currency-id" },
    countryId: { value: undefined },
    isReady: () => Promise.resolve(),
    ensureConfig: () => Promise.resolve({}),
    getConfig: () => ({}),
    getConfigValue: () => undefined
  })
}));

vi.mock("../../config", () => ({
  useConfig: () => ({ data: { clickwrapDisclaimer: "" } })
}));

vi.mock("../../system-localisation", () => ({
  useI18n: () => ({ t: (key: string) => key }),
  useLocale: () => ({ locale: { value: "en" } })
}));

vi.mock("../../session-store", () => ({
  useActiveSession: () => ({
    useContext: () => ({
      activeUser: { value: { id: "test-user-id" } }
    }),
    useMeta: () => ({
      isAuthenticated: { value: true }
    })
  }),
  useSessionStore: () => ({
    initStore: vi.fn(() => Promise.resolve()),
    useActions: () => ({ add: vi.fn() })
  })
}));

const CURRENCY: ICurrency = {
  id: "test-currency-id",
  code: "GBP"
} as ICurrency;

function storableGateway(): IGateway {
  return {
    id: "test-gateway-id",
    is_stored: true,
    store_outside_payment: true,
    store_on_payment: false,
    gateway_provider: { store_type: GatewayStoreType.TOKEN, code: "Stripe" }
  } as IGateway;
}

const CLIENT: IClient = { id: "test-client-id" } as IClient;

function payContext(): GatewayContext {
  return {
    ctx: GatewayCtx.PAY,
    client: CLIENT,
    gateway: storableGateway(),
    currency: CURRENCY,
    amount: 50,
    orderId: "test-order-id",
    supported: true,
    model: { amount: 50 }
  } as GatewayContext;
}

function addContext(): GatewayContext {
  return {
    ctx: GatewayCtx.ADD,
    client: CLIENT,
    gateway: storableGateway(),
    currency: CURRENCY,
    supported: true,
    model: {}
  } as GatewayContext;
}

type Service = Interpreter<GatewayContext, never, never, never, never>;

describe("gatewayMachine — factory and instantiation", () => {
  it("AC-A1 createGatewayMachine returns a machine for stripe", () => {
    const machine = createGatewayMachine("stripe");
    expect(machine).toBeDefined();
    expect(typeof machine.withContext).toBe("function");
  });

  it("AC-A1 createGatewayMachine returns a machine for braintree", () => {
    const machine = createGatewayMachine("braintree");
    expect(machine).toBeDefined();
    expect(typeof machine.withContext).toBe("function");
  });

  it("AC-A1 createGatewayMachine returns a machine for card", () => {
    const machine = createGatewayMachine("card");
    expect(machine).toBeDefined();
    expect(typeof machine.withContext).toBe("function");
  });

  it("AC-A1 createGatewayMachine returns a machine for razorpay", () => {
    const machine = createGatewayMachine("razorpay");
    expect(machine).toBeDefined();
    expect(typeof machine.withContext).toBe("function");
  });

  it("AC-A1 createGatewayMachine returns a machine for openPay", () => {
    const machine = createGatewayMachine("openPay");
    expect(machine).toBeDefined();
    expect(typeof machine.withContext).toBe("function");
  });

  it("AC-A1 createGatewayMachine returns a machine for mercadoPago", () => {
    const machine = createGatewayMachine("mercadoPago");
    expect(machine).toBeDefined();
    expect(typeof machine.withContext).toBe("function");
  });

  it("AC-A1 createGatewayMachine returns a machine for dlocal", () => {
    const machine = createGatewayMachine("dlocal");
    expect(machine).toBeDefined();
    expect(typeof machine.withContext).toBe("function");
  });

  it("AC-A1 createGatewayMachine returns a machine for nicky", () => {
    const machine = createGatewayMachine("nicky");
    expect(machine).toBeDefined();
    expect(typeof machine.withContext).toBe("function");
  });
});

describe("gatewayMachine — initial state", () => {
  let service: Service | undefined;

  afterEach(() => {
    service?.stop();
    service = undefined;
    vi.clearAllMocks();
  });

  it("AC-A2 starts in loading state for PAY context", () => {
    service = interpret(
      createGatewayMachine("stripe").withContext(payContext()),
      { devTools: false }
    ) as unknown as Service;

    service.start();

    expect(service.state.matches("loading")).toBe(true);
  });

  it("AC-A2 starts in loading state for ADD context", () => {
    service = interpret(
      createGatewayMachine("stripe").withContext(addContext()),
      { devTools: false }
    ) as unknown as Service;

    service.start();

    expect(service.state.matches("loading")).toBe(true);
  });

  it("AC-E3 preserves supported flag from context", () => {
    const ctx = payContext();
    ctx.supported = false;

    service = interpret(createGatewayMachine("stripe").withContext(ctx), {
      devTools: false
    }) as unknown as Service;

    service.start();

    expect(service.state.context.supported).toBe(false);
  });

  it("preserves ctx (PAY/ADD) from context", () => {
    const ctx = addContext();

    service = interpret(createGatewayMachine("stripe").withContext(ctx), {
      devTools: false
    }) as unknown as Service;

    service.start();

    expect(service.state.context.ctx).toBe(GatewayCtx.ADD);
  });

  it("preserves gateway from context", () => {
    const ctx = payContext();

    service = interpret(createGatewayMachine("stripe").withContext(ctx), {
      devTools: false
    }) as unknown as Service;

    service.start();

    expect(service.state.context.gateway.id).toBe("test-gateway-id");
  });

  it("preserves client from context", () => {
    const ctx = payContext();

    service = interpret(createGatewayMachine("stripe").withContext(ctx), {
      devTools: false
    }) as unknown as Service;

    service.start();

    expect(service.state.context.client.id).toBe("test-client-id");
  });

  it("preserves amount from context for PAY", () => {
    const ctx = payContext();

    service = interpret(createGatewayMachine("stripe").withContext(ctx), {
      devTools: false
    }) as unknown as Service;

    service.start();

    expect(service.state.context.amount).toBe(50);
  });
});

describe("gatewayMachine — event vocabulary in loading state", () => {
  let service: Service | undefined;

  afterEach(() => {
    service?.stop();
    service = undefined;
  });

  it("nextEvents in loading excludes SUBMIT", () => {
    service = interpret(
      createGatewayMachine("stripe").withContext(payContext()),
      { devTools: false }
    ) as unknown as Service;

    service.start();

    expect(service.state.matches("loading")).toBe(true);
    expect(service.state.nextEvents).not.toContain("SUBMIT");
  });

  it("nextEvents in loading excludes RENDER", () => {
    service = interpret(
      createGatewayMachine("stripe").withContext(payContext()),
      { devTools: false }
    ) as unknown as Service;

    service.start();

    expect(service.state.matches("loading")).toBe(true);
    expect(service.state.nextEvents).not.toContain("RENDER");
  });
});

describe("gatewayMachine — state graph structure", () => {
  it("exposes states object for runtime introspection", () => {
    const machine = createGatewayMachine("stripe");
    expect(machine.states).toBeDefined();
    expect(typeof machine.states).toBe("object");
  });

  it("exposes options services for runtime discovery", () => {
    const machine = createGatewayMachine("stripe");
    const serviceNames = Object.keys(machine.options?.services || {});
    expect(serviceNames).toContain("load");
    expect(serviceNames).toContain("pay");
  });

  it("has loading state", () => {
    const machine = createGatewayMachine("stripe");
    expect(machine.states).toHaveProperty("loading");
  });

  it("has available state", () => {
    const machine = createGatewayMachine("stripe");
    expect(machine.states).toHaveProperty("available");
  });

  it("has processing state", () => {
    const machine = createGatewayMachine("stripe");
    expect(machine.states).toHaveProperty("processing");
  });

  it("has complete state", () => {
    const machine = createGatewayMachine("stripe");
    expect(machine.states).toHaveProperty("complete");
  });

  it("has unavailable state", () => {
    const machine = createGatewayMachine("stripe");
    expect(machine.states).toHaveProperty("unavailable");
  });
});
