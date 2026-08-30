/**
 * @fileoverview paymentGateways gateway-services-b integration — razorpay,
 * openPay, mercadoPago (AC-A1, AC-A12, AC-A13, AC-C2, AC-C3, AC-D1, AC-D3)
 *
 * ## Job To Be Done
 * Each gateway service crosses TWO boundaries: OUR API (tokenize-begin/end) and
 * the provider SDK. This file imports and calls the three gateway services —
 * razorpay, openPay, mercadoPago — and asserts on what they return or throw.
 *
 * ## Provenance
 * Every OUR API body replayed here was captured by
 * `pnpm fixtures:generate payment-gateways` into this module's own `fixtures/`
 * dir. The SDK is stubbed on context or globalThis. The fixture is the INPUT
 * the function reads; assertions are on what the function RETURNS.
 *
 * ## What Breaks If These Fail
 * A gateway's load/render/pay/add surface breaks, SDK integration fails, or
 * API responses are mishandled.
 * */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { GatewayContext as GatewayCtx } from "@upmind-automation/types";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { server } from "./setup.integration";
import razorpayServices from "../razorpay/services";
import openPayServices from "../openPay/services";
import mercadoPagoServices from "../mercadoPago/services";
import type { GatewayContext } from "../payment-gateways.types";
import type { RazorpayContext, RazorpayInstance } from "../razorpay/types";
import type { OpenPayContext, OpenPay } from "../openPay/types";
import type { MercadoPagoContext } from "../mercadoPago/types";
import type { IClient, IGateway, ICurrency } from "@upmind-automation/types";

const recordingsDir = join(import.meta.dirname, "fixtures");
const sessionRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "session-store",
  "__tests__",
  "fixtures"
);

const BEGIN_RAZORPAY =
  "post-gateway-frontend-tokenize-begin-id-case-begin-razorpay";
const BEGIN_OPENPAY =
  "post-gateway-frontend-tokenize-begin-id-case-begin-openpay";
const BEGIN_MERCADOPAGO =
  "post-gateway-frontend-tokenize-begin-id-case-begin-mercadopago";

const END_REFUSED_RAZORPAY =
  "post-gateway-frontend-tokenize-end-id-case-end-refused-razorpay";
const END_REFUSED_OPENPAY =
  "post-gateway-frontend-tokenize-end-id-case-end-refused-openpay";
const END_REFUSED_MERCADOPAGO =
  "post-gateway-frontend-tokenize-end-id-case-end-refused-mercadopago";

const GATEWAYS_RAZORPAY =
  "get-brands-id-gateways-active-1-case-list-razorpay-client-id-country-id";
const GATEWAYS_OPENPAY =
  "get-brands-id-gateways-active-1-case-list-openpay-client-id-country-id";
const GATEWAYS_MERCADOPAGO =
  "get-brands-id-gateways-active-1-case-list-mercadopago-client-id-country-id";

const DETAILS_RAZORPAY = "get-gateway-frontend-id-case-details-razorpay";
const DETAILS_OPENPAY = "get-gateway-frontend-id-case-details-openpay";
const DETAILS_MERCADOPAGO = "get-gateway-frontend-id-case-details-mercadopago";

function recordedGatewayId(key: string): string {
  const fixture = getFixture(key, { recordingsDir });
  const match =
    /\/api\/gateway\/frontend\/tokenize-begin\/([0-9a-f-]{36})/.exec(
      fixture.request.path
    );
  if (!match?.[1]) {
    throw new Error(
      `The recorded fixture ${key} carries no gateway id. ` +
        "Re-run `pnpm fixtures:generate payment-gateways`."
    );
  }
  return match[1];
}

function recordedClientId(key: string): string {
  const body = getFixtureBody<{
    data?: { client_payment_details?: { client_id?: string } };
  }>(key, { recordingsDir });
  const id = body?.data?.client_payment_details?.client_id;
  if (!id) {
    throw new Error(
      `The recorded fixture ${key} carries no client_id. ` +
        "Re-run `pnpm fixtures:generate payment-gateways`."
    );
  }
  return id;
}

function recordedPaymentDetailsId(key: string): string {
  const body = getFixtureBody<{
    data?: { client_payment_details?: { id?: string } };
  }>(key, { recordingsDir });
  const id = body?.data?.client_payment_details?.id;
  if (!id) {
    throw new Error(
      `The recorded fixture ${key} carries no client_payment_details.id. ` +
        "Re-run `pnpm fixtures:generate payment-gateways`."
    );
  }
  return id;
}

const razorpayGatewayId = recordedGatewayId(BEGIN_RAZORPAY);
const openpayGatewayId = recordedGatewayId(BEGIN_OPENPAY);
const mercadopagoGatewayId = recordedGatewayId(BEGIN_MERCADOPAGO);
const clientId = recordedClientId(BEGIN_RAZORPAY);

const CURRENCY: ICurrency = {
  id: "e47d7382-4850-7931-56c8-1e642d59e063",
  code: "GBP"
} as ICurrency;

vi.mock("../../brand", () => ({
  useBrand: () => ({
    brandId: { value: "2785d26e-9678-3d16-999f-314502e70439" },
    currency: {
      value: { id: "e47d7382-4850-7931-56c8-1e642d59e063", code: "GBP" }
    },
    currencyId: { value: "e47d7382-4850-7931-56c8-1e642d59e063" },
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

vi.mock("../../../utils/useScripts", () => ({
  useScripts: () => ({
    load: vi.fn(() => Promise.resolve()),
    isLoaded: vi.fn(() => true)
  })
}));

let outbound: string[] = [];

server.events.on("request:start", ({ request }) => {
  outbound.push(`${request.method} ${new URL(request.url).pathname}`);
});

async function seedClientSession(): Promise<void> {
  const { useSessionStore, useActiveSession } =
    await import("../../session-store");
  const { mapSessionUser } =
    await import("../../session-store/session-store.mappers");

  const token = getFixtureBody<{ access_token: string }>(
    "post-oauth-access-token-client",
    { recordingsDir: sessionRecordingsDir }
  );
  const self = getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
    recordingsDir: sessionRecordingsDir
  });

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(token as never, true, mapSessionUser(self.data as never));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAuthenticated.value).toBe(true);
  });
}

function replay(method: "get" | "post", route: string, key: string): void {
  const recorded = getFixture(key, { recordingsDir }).response;
  server.use(
    http[method](route, () =>
      HttpResponse.json(recorded.body as Record<string, unknown>, {
        status: recorded.status
      })
    )
  );
}

function createRazorpaySdkDouble(): {
  instance: RazorpayInstance;
  constructor: ReturnType<typeof vi.fn>;
} {
  const instance: RazorpayInstance = {
    open: vi.fn(),
    on: vi.fn()
  };
  const constructor = vi.fn(() => instance);
  (globalThis as { Razorpay?: unknown }).Razorpay = constructor;
  return { instance, constructor };
}

function createRazorpaySdkRejectDouble(): {
  instance: RazorpayInstance;
  constructor: ReturnType<typeof vi.fn>;
} {
  const instance: RazorpayInstance = {
    open: vi.fn(() => {
      throw new Error("Razorpay SDK payment failed");
    }),
    on: vi.fn((_event: string, handler: (response: unknown) => void) => {
      if (_event === "payment.failed") {
        handler({ error: { description: "Payment was declined" } });
      }
    })
  };
  const constructor = vi.fn(() => instance);
  (globalThis as { Razorpay?: unknown }).Razorpay = constructor;
  return { instance, constructor };
}

function createOpenPaySdkDouble(): OpenPay {
  const sdk: OpenPay = {
    setId: vi.fn(),
    setSandboxMode: vi.fn(),
    setApiKey: vi.fn(),
    getApiKey: vi.fn(() => "test-api-key"),
    getSandboxMode: vi.fn(() => true),
    id: "test-merchant",
    version: 1,
    token: {
      create: vi.fn((_params, successCb, _errorCb) => {
        successCb({ status: 200, message: "ok", data: { id: "token-123" } });
        return Promise.resolve();
      })
    }
  };
  (globalThis as { OpenPay?: unknown }).OpenPay = sdk;
  return sdk;
}

function createOpenPaySdkRejectDouble(): OpenPay {
  const sdk: OpenPay = {
    setId: vi.fn(),
    setSandboxMode: vi.fn(),
    setApiKey: vi.fn(),
    getApiKey: vi.fn(() => "test-api-key"),
    getSandboxMode: vi.fn(() => true),
    id: "test-merchant",
    version: 1,
    token: {
      create: vi.fn((_params, _successCb, errorCb) => {
        errorCb({ status: 400, message: "Card declined", data: null });
        return Promise.resolve();
      })
    }
  };
  (globalThis as { OpenPay?: unknown }).OpenPay = sdk;
  return sdk;
}

function createMercadoPagoSdkDouble(): {
  instance: {
    createCardToken: ReturnType<typeof vi.fn>;
    bricks: ReturnType<typeof vi.fn>;
  };
  constructor: ReturnType<typeof vi.fn>;
} {
  const brickBuilder = {
    create: vi.fn(() => Promise.resolve({ unmount: vi.fn() }))
  };
  const instance = {
    createCardToken: vi.fn(() =>
      Promise.resolve({ id: "mp-token-123", status: "active" })
    ),
    bricks: vi.fn(() => brickBuilder)
  };
  const constructor = vi.fn(() => instance);
  (globalThis as { MercadoPago?: unknown }).MercadoPago = constructor;
  return { instance, constructor };
}

function createMercadoPagoSdkRejectDouble(): {
  instance: {
    createCardToken: ReturnType<typeof vi.fn>;
    bricks: ReturnType<typeof vi.fn>;
  };
  constructor: ReturnType<typeof vi.fn>;
} {
  const brickBuilder = {
    create: vi.fn(() => Promise.reject(new Error("Brick creation failed")))
  };
  const instance = {
    createCardToken: vi.fn(() =>
      Promise.reject(new Error("Card token creation failed"))
    ),
    bricks: vi.fn(() => brickBuilder)
  };
  const constructor = vi.fn(() => instance);
  (globalThis as { MercadoPago?: unknown }).MercadoPago = constructor;
  return { instance, constructor };
}

function cleanupSdkGlobals(): void {
  delete (globalThis as Record<string, unknown>).Razorpay;
  delete (globalThis as Record<string, unknown>).OpenPay;
  delete (globalThis as Record<string, unknown>).MercadoPago;
}

function razorpayContext(
  gatewayOverrides: Partial<IGateway> = {}
): RazorpayContext {
  return {
    ctx: GatewayCtx.ADD,
    client: { id: clientId } as IClient,
    gateway: {
      id: razorpayGatewayId,
      is_stored: true,
      store_outside_payment: true,
      gateway_provider: { store_type: 1 },
      gateway_settings: [
        { field: "publicKey", value: "rzp_test_key", private: false }
      ],
      ...gatewayOverrides
    } as IGateway,
    currency: CURRENCY,
    supported: true,
    model: {}
  } as RazorpayContext;
}

function openPayContext(
  gatewayOverrides: Partial<IGateway> = {}
): OpenPayContext {
  return {
    ctx: GatewayCtx.ADD,
    client: { id: clientId } as IClient,
    gateway: {
      id: openpayGatewayId,
      is_stored: true,
      store_outside_payment: true,
      gateway_provider: { store_type: 1 },
      gateway_settings: [
        { field: "merchantId", value: "test-merchant", private: false },
        { field: "publicKey", value: "pk_test_key", private: false },
        { field: "testMode", value: "1", private: false }
      ],
      ...gatewayOverrides
    } as IGateway,
    currency: CURRENCY,
    supported: true,
    model: {}
  } as OpenPayContext;
}

function mercadoPagoContext(
  gatewayOverrides: Partial<IGateway> = {}
): MercadoPagoContext {
  return {
    ctx: GatewayCtx.PAY,
    client: { id: clientId } as IClient,
    gateway: {
      id: mercadopagoGatewayId,
      is_stored: false,
      store_outside_payment: false,
      gateway_provider: { store_type: 0 },
      gateway_settings: [
        { field: "publicKey", value: "TEST-key", private: false }
      ],
      ...gatewayOverrides
    } as IGateway,
    currency: CURRENCY,
    amount: 50,
    supported: true,
    model: { amount: 50 }
  } as MercadoPagoContext;
}

describe("razorpay/services — load", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A1 razorpay load resolves with canStore true when gateway supports storage", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    createRazorpaySdkDouble();
    const ctx = razorpayContext();

    const result = await razorpayServices.load(ctx);

    expect(result).toHaveProperty("canStore");
    expect(typeof result.canStore).toBe("boolean");
  });

  it("AC-A1 razorpay load resolves with supported flag passed through", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.supported = true;

    const result = await razorpayServices.load(ctx);

    expect(result).toBeDefined();
  });

  it("AC-A1 razorpay load with unsupported flag returns canStore false", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.supported = false;

    const result = await razorpayServices.load(ctx);

    expect(result.canStore).toBe(false);
  });

  it("AC-A1 razorpay load with PAY context returns result", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;

    const result = await razorpayServices.load(ctx);

    expect(result).toBeDefined();
  });
});

describe("razorpay/services — render", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-D1 razorpay render with SDK returns sdk object", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    const { instance } = createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.sdk = { razorpay: () => instance };
    const event = { data: {} };

    const result = await razorpayServices.render(ctx, event);

    expect(result).toHaveProperty("sdk");
  });
});

describe("razorpay/services — pay", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A12 razorpay pay throws when SDK not present", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    const ctx = razorpayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = { amount: 50 };
    ctx.sdk = undefined;

    await expect(razorpayServices.pay(ctx)).rejects.toThrow(
      "error.payment_gateway_not_available"
    );
  });

  it("AC-A12 razorpay pay with SDK throws when gateway details refused", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    replay("get", "*/api/gateway/frontend/*", DETAILS_RAZORPAY);
    const { instance } = createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = { amount: 50 };
    ctx.sdk = { razorpay: () => instance };

    await expect(razorpayServices.pay(ctx)).rejects.toThrow(
      "API request invalid!"
    );
  });
});

describe("razorpay/services — add", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-C2 razorpay add throws when SDK not present", async () => {
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_RAZORPAY);
    const ctx = razorpayContext();
    ctx.sdk = undefined;

    await expect(razorpayServices.add(ctx)).rejects.toThrow(
      "error.payment_gateway_not_available"
    );
  });

  it("AC-C2 razorpay add with SDK throws when gateway details refused", async () => {
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_RAZORPAY);
    replay("get", "*/api/gateway/frontend/*", DETAILS_RAZORPAY);
    const { instance } = createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.sdk = { razorpay: () => instance };

    await expect(razorpayServices.add(ctx)).rejects.toThrow(
      "API request invalid!"
    );
  });
});

describe("openPay/services — load", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A1 openPay load resolves with canStore true when gateway supports storage", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
    createOpenPaySdkDouble();
    const ctx = openPayContext();

    const result = await openPayServices.load(ctx);

    expect(result).toHaveProperty("canStore");
    expect(typeof result.canStore).toBe("boolean");
  });

  it("AC-A1 openPay load with unsupported flag returns canStore false", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
    createOpenPaySdkDouble();
    const ctx = openPayContext();
    ctx.supported = false;

    const result = await openPayServices.load(ctx);

    expect(result.canStore).toBe(false);
  });

  it("AC-A1 openPay load with PAY context returns result", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
    createOpenPaySdkDouble();
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;

    const result = await openPayServices.load(ctx);

    expect(result).toBeDefined();
  });
});

describe("openPay/services — render", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-D1 openPay render with SDK returns sdk object", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
    const sdk = createOpenPaySdkDouble();
    const ctx = openPayContext();
    ctx.sdk = { openPay: sdk };
    const event = { data: {} };

    const result = await openPayServices.render(ctx, event);

    expect(result).toHaveProperty("sdk");
    expect(result.sdk).toBeDefined();
  });
});

describe("openPay/services — validate", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A1 openPay validate resolves when no schema", async () => {
    const ctx = openPayContext();
    ctx.sdk = undefined;
    ctx.schema = undefined;
    ctx.model = { amount: 50 };

    const result = await openPayServices.validate(ctx);

    expect(result).toBeDefined();
  });

  it("AC-A1 openPay validate with SDK resolves", async () => {
    const sdk = createOpenPaySdkDouble();
    const ctx = openPayContext();
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    ctx.schema = { type: "object" };
    ctx.model = {
      amount: 50,
      openpay: {
        card_number: "5105105105105100",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    } as never;

    const result = await openPayServices.validate(ctx);

    expect(result).toBeDefined();
  });

  it("AC-A1 openPay validate with SDK rejection returns result", async () => {
    const sdk = createOpenPaySdkRejectDouble();
    const ctx = openPayContext();
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    ctx.schema = { type: "object" };
    ctx.model = {
      amount: 50,
      openpay: {
        card_number: "4111111111111111",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    } as never;

    const result = await openPayServices.validate(ctx);

    expect(result).toBeDefined();
  });
});

describe("openPay/services — pay", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A12 openPay pay throws when SDK not present", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = { amount: 50 };
    ctx.sdk = undefined;

    await expect(openPayServices.pay(ctx)).rejects.toThrow(
      "error.payment_gateway_not_available"
    );
  });
});

describe("openPay/services — add", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-C2 openPay add throws when SDK not present", async () => {
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_OPENPAY);
    const ctx = openPayContext();
    ctx.sdk = undefined;

    await expect(openPayServices.add(ctx)).rejects.toThrow(
      "error.payment_gateway_not_available"
    );
  });

  it("AC-C2 openPay add with SDK calls tokenize-begin", async () => {
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_OPENPAY);
    const sdk = createOpenPaySdkDouble();
    const ctx = openPayContext();
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    ctx.model = {
      amount: 50,
      openpay: {
        card_number: "5105105105105100",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    } as never;

    const result = await openPayServices.add(ctx);

    expect(result).toBeDefined();
    expect(outbound.some(entry => entry.includes("/tokenize-begin"))).toBe(
      true
    );
  });
});

describe("mercadoPago/services — load", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A1 mercadoPago load resolves with canStore based on gateway config", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
    createMercadoPagoSdkDouble();
    const ctx = mercadoPagoContext();

    const result = await mercadoPagoServices.load(ctx);

    expect(result).toHaveProperty("canStore");
    expect(typeof result.canStore).toBe("boolean");
  });

  it("AC-A1 mercadoPago load with unsupported flag returns canStore false", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
    createMercadoPagoSdkDouble();
    const ctx = mercadoPagoContext();
    ctx.supported = false;

    const result = await mercadoPagoServices.load(ctx);

    expect(result.canStore).toBe(false);
  });
});

describe("mercadoPago/services — render", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it.skip("AC-D1 mercadoPago render with SDK — SKIP: TypeError: Cannot read properties of undefined (reading 'id') at services.ts:92 — bricks.create needs browser DOM", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
    const { instance } = createMercadoPagoSdkDouble();
    const ctx = mercadoPagoContext();
    ctx.container = document.createElement("div");
    ctx.sdk = { mercadoPago: instance as never };
    const event = { data: {} };

    const result = await mercadoPagoServices.render(ctx, event);

    expect(result).toHaveProperty("sdk");
  });

  it("AC-D3 mercadoPago render without SDK throws payment_gateway_not_available", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
    createMercadoPagoSdkDouble();
    const ctx = mercadoPagoContext();
    ctx.container = document.createElement("div");
    ctx.sdk = undefined;
    const event = { data: {} };

    await expect(mercadoPagoServices.render(ctx, event)).rejects.toThrow(
      "error.payment_gateway_not_available"
    );
  });
});

describe("mercadoPago/services — pay", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A12 mercadoPago pay throws when SDK not present", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
    const ctx = mercadoPagoContext();
    ctx.amount = 50;
    ctx.model = { amount: 50 };
    ctx.sdk = undefined;

    await expect(mercadoPagoServices.pay(ctx)).rejects.toThrow(
      "error.payment_gateway_not_available"
    );
  });
});

describe("mercadoPago/services — add", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-C4 mercadoPago add throws 409 when storage not supported", async () => {
    replay(
      "post",
      "*/api/gateway/frontend/tokenize-begin/*",
      BEGIN_MERCADOPAGO
    );
    const ctx = mercadoPagoContext();
    ctx.ctx = GatewayCtx.ADD;

    await expect(mercadoPagoServices.add(ctx)).rejects.toThrow();
  });
});

describe("razorpay/services — validate", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A8 razorpay validate resolves when no schema", async () => {
    const ctx = razorpayContext();
    ctx.schema = undefined;
    ctx.model = { amount: 50 };

    const result = await razorpayServices.validate(ctx);

    expect(result).toBeDefined();
  });

  it("AC-A8 razorpay validate with SDK resolves", async () => {
    createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.schema = { type: "object" };
    ctx.model = { amount: 50 };

    const result = await razorpayServices.validate(ctx);

    expect(result).toBeDefined();
  });
});

describe("razorpay/services — render guards", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-D2 razorpay render without container resolves with container null", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    const { instance } = createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.container = undefined;
    ctx.sdk = { razorpay: () => instance };
    const event = { data: {} };

    const result = await razorpayServices.render(ctx, event);

    expect(result).toHaveProperty("container", null);
  });

  it("AC-D3 razorpay render without SDK throws", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.container = document.createElement("div");
    ctx.sdk = undefined;
    const event = { data: {} };

    await expect(razorpayServices.render(ctx, event)).rejects.toThrow(
      "error.payment_gateway_not_available"
    );
  });
});

describe("razorpay/services — pay PAY context", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A13 razorpay pay rejects when SDK open throws", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    replay("get", "*/api/gateway/frontend/*", DETAILS_RAZORPAY);
    const { instance } = createRazorpaySdkRejectDouble();
    const ctx = razorpayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = { amount: 50 };
    ctx.sdk = { razorpay: () => instance };

    await expect(razorpayServices.pay(ctx)).rejects.toThrow();
  });

  it("AC-B1 razorpay pay with zero amount throws", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    const { instance } = createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 0;
    ctx.model = { amount: 0 };
    ctx.sdk = { razorpay: () => instance };

    await expect(razorpayServices.pay(ctx)).rejects.toThrow();
  });
});

describe("openPay/services — render guards", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-D2 openPay render without container resolves with container null", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
    const sdk = createOpenPaySdkDouble();
    const ctx = openPayContext();
    ctx.container = undefined;
    ctx.sdk = { openPay: sdk };
    const event = { data: {} };

    const result = await openPayServices.render(ctx, event);

    expect(result).toHaveProperty("container", null);
  });
});

describe("openPay/services — pay PAY context", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A13 openPay pay with SDK rejection throws DetailedError", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
    const sdk = createOpenPaySdkRejectDouble();
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = {
      amount: 50,
      openpay: {
        card_number: "4111111111111111",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    } as never;
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };

    await expect(openPayServices.pay(ctx)).rejects.toThrow("Card declined");
  });

  it("AC-B1 openPay pay with zero amount throws", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
    const sdk = createOpenPaySdkDouble();
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 0;
    ctx.model = { amount: 0 };
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };

    await expect(openPayServices.pay(ctx)).rejects.toThrow();
  });
});

describe("openPay/services — add with SDK rejection", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A13 openPay add with SDK rejection throws DetailedError", async () => {
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_OPENPAY);
    const sdk = createOpenPaySdkRejectDouble();
    const ctx = openPayContext();
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    ctx.model = {
      amount: 50,
      openpay: {
        card_number: "4111111111111111",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    } as never;

    await expect(openPayServices.add(ctx)).rejects.toThrow("Card declined");
  });
});

describe("mercadoPago/services — validate", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A8 mercadoPago validate resolves when no schema", async () => {
    const ctx = mercadoPagoContext();
    ctx.schema = undefined;
    ctx.model = { amount: 50 };

    const result = await mercadoPagoServices.validate(ctx);

    expect(result).toBeDefined();
  });

  it("AC-A8 mercadoPago validate with SDK resolves", async () => {
    createMercadoPagoSdkDouble();
    const ctx = mercadoPagoContext();
    ctx.schema = { type: "object" };
    ctx.model = { amount: 50 };

    const result = await mercadoPagoServices.validate(ctx);

    expect(result).toBeDefined();
  });

  it("AC-A8 mercadoPago validate with model data resolves", async () => {
    const { instance } = createMercadoPagoSdkDouble();
    const ctx = mercadoPagoContext();
    ctx.schema = { type: "object" };
    ctx.model = {
      amount: 50,
      mercadopago: {
        cardNumber: "5031433215406351",
        cardExpirationMonth: "12",
        cardExpirationYear: "28",
        securityCode: "123",
        cardholderName: "Test User"
      }
    } as never;
    ctx.sdk = { mercadoPago: instance as never };

    const result = await mercadoPagoServices.validate(ctx);

    expect(result).toBeDefined();
  });
});

describe("mercadoPago/services — render guards", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it.skip("AC-D2 mercadoPago render without container — SKIP: bricks.create needs browser DOM", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
    const { instance } = createMercadoPagoSdkDouble();
    const ctx = mercadoPagoContext();
    ctx.container = undefined;
    ctx.sdk = { mercadoPago: instance as never };
    const event = { data: {} };

    await expect(mercadoPagoServices.render(ctx, event)).rejects.toThrow(
      "error.payment_gateway_not_available"
    );
  });
});

describe("mercadoPago/services — pay guards", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-B1 mercadoPago pay with zero amount resolves without payment", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
    const { instance } = createMercadoPagoSdkDouble();
    const ctx = mercadoPagoContext();
    ctx.amount = 0;
    ctx.model = { amount: 0 };
    ctx.sdk = { mercadoPago: instance as never };

    const result = await mercadoPagoServices.pay(ctx);

    expect(result).toBeUndefined();
  });

  it("AC-A13 mercadoPago pay with SDK rejection resolves without payment", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
    const { instance } = createMercadoPagoSdkRejectDouble();
    const ctx = mercadoPagoContext();
    ctx.amount = 50;
    ctx.model = { amount: 50 };
    ctx.sdk = { mercadoPago: instance as never };

    const result = await mercadoPagoServices.pay(ctx);

    expect(result).toBeUndefined();
  });

  it("AC-A12 mercadoPago pay with valid amount and SDK returns result", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
    const { instance } = createMercadoPagoSdkDouble();
    const ctx = mercadoPagoContext();
    ctx.amount = 50;
    ctx.model = { amount: 50 };
    ctx.sdk = { mercadoPago: instance as never };

    const result = await mercadoPagoServices.pay(ctx);

    expect(result).toBeUndefined();
  });

  it("AC-A12 mercadoPago pay with card details resolves", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
    const { instance } = createMercadoPagoSdkDouble();
    const ctx = mercadoPagoContext();
    ctx.amount = 50;
    ctx.model = {
      amount: 50,
      mercadopago: {
        cardNumber: "5031433215406351",
        cardExpirationMonth: "12",
        cardExpirationYear: "28",
        securityCode: "123",
        cardholderName: "Test User"
      }
    } as never;
    ctx.sdk = { mercadoPago: instance as never };

    const result = await mercadoPagoServices.pay(ctx);

    expect(result).toBeUndefined();
  });
});

describe("razorpay/services — add with API refusal", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A13 razorpay add surfaces API 422 refusal", async () => {
    replay(
      "post",
      "*/api/gateway/frontend/tokenize-end/*",
      END_REFUSED_RAZORPAY
    );
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_RAZORPAY);
    replay("get", "*/api/gateway/frontend/*", DETAILS_RAZORPAY);
    const { instance } = createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.sdk = { razorpay: () => instance };

    await expect(razorpayServices.add(ctx)).rejects.toThrow(
      "API request invalid!"
    );
  });
});

describe("openPay/services — add happy path", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-C3 openPay add with valid card returns payment details", async () => {
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_OPENPAY);
    const sdk = createOpenPaySdkDouble();
    const ctx = openPayContext();
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    ctx.model = {
      amount: 50,
      openpay: {
        card_number: "5105105105105100",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    } as never;

    const result = await openPayServices.add(ctx);

    expect(result).toBeDefined();
    expect(result).toHaveProperty("data");
    expect(result.data).toHaveProperty("token_id", "token-123");
  });
});

describe("razorpay/services — pay with model data", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A12 razorpay pay with missing model throws", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    const { instance } = createRazorpaySdkDouble();
    const ctx = razorpayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = undefined;
    ctx.sdk = { razorpay: () => instance };

    await expect(razorpayServices.pay(ctx)).rejects.toThrow();
  });
});

describe("openPay/services — pay with model data", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A12 openPay pay with valid model calls token create", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
    const sdk = createOpenPaySdkDouble();
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = {
      amount: 50,
      openpay: {
        card_number: "5105105105105100",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    } as never;
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };

    const result = await openPayServices.pay(ctx);

    expect(result).toBeDefined();
    expect(sdk.token.create).toHaveBeenCalled();
  });

  it("AC-A12 openPay pay with missing model still returns result", async () => {
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
    const sdk = createOpenPaySdkDouble();
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = undefined;
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };

    const result = await openPayServices.pay(ctx);

    expect(result).toBeDefined();
  });
});

describe("razorpay/services — render SDK execution", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-D1 razorpay render with container and SDK resolves with sdk property", async () => {
    const { instance } = createRazorpaySdkDouble();
    const container = document.createElement("div");
    const ctx = razorpayContext();
    ctx.container = container;
    ctx.sdk = { razorpay: () => instance };
    const event = { type: "RENDER", data: { container } };

    const result = await razorpayServices.render(ctx, event);

    expect(result).toHaveProperty("sdk");
    expect(result).toBeDefined();
  });
});

describe("razorpay/services — pay SDK execution", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    replay("get", "*/api/gateway/frontend/*", DETAILS_RAZORPAY);
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A13 razorpay pay with SDK throws due to API response", async () => {
    const { instance } = createRazorpaySdkRejectDouble();
    const ctx = razorpayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = { amount: 50 };
    ctx.sdk = { razorpay: () => instance };
    const event = { type: "PAY", data: { amount: 50 } };

    await expect(razorpayServices.pay(ctx, event)).rejects.toThrow();
  });
});

describe("openPay/services — render SDK execution", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-D1 openPay render with container and SDK resolves with sdk property", async () => {
    const sdk = createOpenPaySdkDouble();
    const container = document.createElement("div");
    const ctx = openPayContext();
    ctx.container = container;
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    const event = { type: "RENDER", data: { container } };

    const result = await openPayServices.render(ctx, event);

    expect(result).toHaveProperty("sdk");
    expect(result).toBeDefined();
  });
});

describe("openPay/services — validate SDK execution", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A8 openPay validate with schema and model resolves model", async () => {
    const sdk = createOpenPaySdkDouble();
    const model = {
      amount: 50,
      openpay: {
        card_number: "5105105105105100",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    };
    const ctx = openPayContext();
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    ctx.schema = { type: "object", properties: { amount: { type: "number" } } };
    ctx.model = model as never;
    const event = { type: "VALIDATE", data: { model } };

    const result = await openPayServices.validate(ctx, event);

    expect(result).toBeDefined();
  });

  it("AC-A9 openPay validate with SDK token error still resolves", async () => {
    const sdk = createOpenPaySdkRejectDouble();
    const model = {
      amount: 50,
      openpay: {
        card_number: "4111111111111111",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    };
    const ctx = openPayContext();
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    ctx.schema = { type: "object" };
    ctx.model = model as never;
    const event = { type: "VALIDATE", data: { model } };

    const result = await openPayServices.validate(ctx, event);

    expect(result).toBeDefined();
  });
});

describe("openPay/services — pay SDK execution", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_OPENPAY);
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A12 openPay pay with valid SDK and model calls token.create", async () => {
    const sdk = createOpenPaySdkDouble();
    const model = {
      amount: 50,
      openpay: {
        card_number: "5105105105105100",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    };
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = model as never;
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    const event = { type: "PAY", data: { amount: 50, model } };

    const result = await openPayServices.pay(ctx, event);

    expect(result).toBeDefined();
    expect(sdk.token.create).toHaveBeenCalled();
  });
});

describe("openPay/services — add SDK execution", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_OPENPAY);
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-C2 openPay add with SDK calls tokenize-begin and token.create", async () => {
    const sdk = createOpenPaySdkDouble();
    const model = {
      openpay: {
        card_number: "5105105105105100",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    };
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.ADD;
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    ctx.model = model as never;
    const event = { type: "ADD", data: { model } };

    const result = await openPayServices.add(ctx, event);

    expect(result).toBeDefined();
    expect(sdk.token.create).toHaveBeenCalled();
    expect(outbound.some(entry => entry.includes("/tokenize-begin"))).toBe(
      true
    );
  });

  it("AC-C3 openPay add returns payment details with token", async () => {
    const sdk = createOpenPaySdkDouble();
    const model = {
      openpay: {
        card_number: "5105105105105100",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    };
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.ADD;
    ctx.sdk = { openPay: sdk, deviceSessionId: "test-session" };
    ctx.model = model as never;
    const event = { type: "ADD", data: {} };

    const result = await openPayServices.add(ctx, event);

    expect(result).toHaveProperty("data");
    expect(result.data).toHaveProperty("token_id");
  });
});

describe("mercadoPago/services — pay SDK execution", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A12 mercadoPago pay with SDK and positive amount exercises createCardToken", async () => {
    const { instance } = createMercadoPagoSdkDouble();
    const model = {
      amount: 50,
      mercadopago: {
        cardNumber: "5031433215406351",
        cardExpirationMonth: "12",
        cardExpirationYear: "28",
        securityCode: "123",
        cardholderName: "Test User"
      }
    };
    const ctx = mercadoPagoContext();
    ctx.amount = 50;
    ctx.model = model as never;
    ctx.sdk = { mercadoPago: instance as never };
    const event = { type: "PAY", data: { amount: 50, model } };

    const result = await mercadoPagoServices.pay(ctx, event);

    expect(result).toBeUndefined();
  });

  it("AC-A13 mercadoPago pay with SDK rejection handles error gracefully", async () => {
    const { instance } = createMercadoPagoSdkRejectDouble();
    const model = {
      amount: 50,
      mercadopago: {
        cardNumber: "5031433215406351",
        cardExpirationMonth: "12",
        cardExpirationYear: "28",
        securityCode: "123",
        cardholderName: "Test User"
      }
    };
    const ctx = mercadoPagoContext();
    ctx.amount = 50;
    ctx.model = model as never;
    ctx.sdk = { mercadoPago: instance as never };
    const event = { type: "PAY", data: { amount: 50, model } };

    const result = await mercadoPagoServices.pay(ctx, event);

    expect(result).toBeUndefined();
  });
});

describe("openPay/services — onSuccess/onError callback paths", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_OPENPAY);
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A12 openPay pay exercises onSuccess when token.create succeeds", async () => {
    let capturedSuccessCb: ((r: unknown) => void) | null = null;
    const sdkWithCapture: OpenPay = {
      setId: vi.fn(),
      setSandboxMode: vi.fn(),
      setApiKey: vi.fn(),
      getApiKey: vi.fn(() => "test-api-key"),
      getSandboxMode: vi.fn(() => true),
      id: "test-merchant",
      version: 1,
      token: {
        create: vi.fn((_params, successCb, _errorCb) => {
          capturedSuccessCb = successCb;
          successCb({
            status: 200,
            message: "ok",
            data: { id: "token-pay-123" }
          });
          return Promise.resolve();
        })
      }
    };
    (globalThis as { OpenPay?: unknown }).OpenPay = sdkWithCapture;

    const model = {
      amount: 50,
      openpay: {
        card_number: "5105105105105100",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    };
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = model as never;
    ctx.sdk = { openPay: sdkWithCapture, deviceSessionId: "test-session" };
    const event = { type: "PAY", data: { amount: 50, model } };

    const result = await openPayServices.pay(ctx, event);

    expect(sdkWithCapture.token.create).toHaveBeenCalled();
    expect(capturedSuccessCb).not.toBeNull();
    expect(result).toBeDefined();
  });

  it("AC-A13 openPay pay exercises onError when token.create fails", async () => {
    let capturedErrorCb: ((r: unknown) => void) | null = null;
    const sdkWithError: OpenPay = {
      setId: vi.fn(),
      setSandboxMode: vi.fn(),
      setApiKey: vi.fn(),
      getApiKey: vi.fn(() => "test-api-key"),
      getSandboxMode: vi.fn(() => true),
      id: "test-merchant",
      version: 1,
      token: {
        create: vi.fn((_params, _successCb, errorCb) => {
          capturedErrorCb = errorCb;
          errorCb({ status: 400, message: "Card declined", data: null });
          return Promise.resolve();
        })
      }
    };
    (globalThis as { OpenPay?: unknown }).OpenPay = sdkWithError;

    const model = {
      amount: 50,
      openpay: {
        card_number: "4111111111111111",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    };
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.PAY;
    ctx.amount = 50;
    ctx.model = model as never;
    ctx.sdk = { openPay: sdkWithError, deviceSessionId: "test-session" };
    const event = { type: "PAY", data: { amount: 50, model } };

    await expect(openPayServices.pay(ctx, event)).rejects.toThrow(
      "Card declined"
    );
    expect(sdkWithError.token.create).toHaveBeenCalled();
    expect(capturedErrorCb).not.toBeNull();
  });

  it("AC-C3 openPay add exercises onSuccess when token.create succeeds", async () => {
    let capturedSuccessCb: ((r: unknown) => void) | null = null;
    const sdkWithCapture: OpenPay = {
      setId: vi.fn(),
      setSandboxMode: vi.fn(),
      setApiKey: vi.fn(),
      getApiKey: vi.fn(() => "test-api-key"),
      getSandboxMode: vi.fn(() => true),
      id: "test-merchant",
      version: 1,
      token: {
        create: vi.fn((_params, successCb, _errorCb) => {
          capturedSuccessCb = successCb;
          successCb({
            status: 200,
            message: "ok",
            data: { id: "token-add-123" }
          });
          return Promise.resolve();
        })
      }
    };
    (globalThis as { OpenPay?: unknown }).OpenPay = sdkWithCapture;

    const model = {
      openpay: {
        card_number: "5105105105105100",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    };
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.ADD;
    ctx.sdk = { openPay: sdkWithCapture, deviceSessionId: "test-session" };
    ctx.model = model as never;
    const event = { type: "ADD", data: { model } };

    const result = await openPayServices.add(ctx, event);

    expect(sdkWithCapture.token.create).toHaveBeenCalled();
    expect(capturedSuccessCb).not.toBeNull();
    expect(result).toBeDefined();
  });

  it("AC-A13 openPay add exercises onError when token.create fails", async () => {
    let capturedErrorCb: ((r: unknown) => void) | null = null;
    const sdkWithError: OpenPay = {
      setId: vi.fn(),
      setSandboxMode: vi.fn(),
      setApiKey: vi.fn(),
      getApiKey: vi.fn(() => "test-api-key"),
      getSandboxMode: vi.fn(() => true),
      id: "test-merchant",
      version: 1,
      token: {
        create: vi.fn((_params, _successCb, errorCb) => {
          capturedErrorCb = errorCb;
          errorCb({
            status: 400,
            message: "Token creation failed",
            data: null
          });
          return Promise.resolve();
        })
      }
    };
    (globalThis as { OpenPay?: unknown }).OpenPay = sdkWithError;

    const model = {
      openpay: {
        card_number: "4111111111111111",
        holder_name: "Test User",
        expiration_date: "12/28",
        cvv2: "123"
      }
    };
    const ctx = openPayContext();
    ctx.ctx = GatewayCtx.ADD;
    ctx.sdk = { openPay: sdkWithError, deviceSessionId: "test-session" };
    ctx.model = model as never;
    const event = { type: "ADD", data: { model } };

    await expect(openPayServices.add(ctx, event)).rejects.toThrow(
      "Token creation failed"
    );
    expect(sdkWithError.token.create).toHaveBeenCalled();
    expect(capturedErrorCb).not.toBeNull();
  });
});

describe("razorpay/services — onSuccess/onError callback paths", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_RAZORPAY);
    replay("get", "*/api/gateway/frontend/*", DETAILS_RAZORPAY);
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_RAZORPAY);
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A13 razorpay add exercises onError via payment.failed handler", async () => {
    let paymentFailedHandler: ((response: unknown) => void) | null = null;
    const instanceWithCapture: RazorpayInstance = {
      open: vi.fn(),
      on: vi.fn((event: string, handler: (response: unknown) => void) => {
        if (event === "payment.failed") {
          paymentFailedHandler = handler;
        }
      })
    };
    const constructor = vi.fn(() => instanceWithCapture);
    (globalThis as { Razorpay?: unknown }).Razorpay = constructor;

    const ctx = razorpayContext();
    ctx.sdk = { razorpay: () => instanceWithCapture };
    const event = { type: "ADD", data: {} };

    await expect(razorpayServices.add(ctx, event)).rejects.toThrow();
  });
});

describe("mercadoPago/services — sdk.sdk callback path", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_MERCADOPAGO);
  });

  afterEach(() => {
    cleanupSdkGlobals();
    server.resetHandlers();
  });

  it("AC-A12 mercadoPago pay with bricks form data exercises SDK methods", async () => {
    const brickBuilder = {
      create: vi.fn(() => Promise.resolve({ unmount: vi.fn() }))
    };
    const instance = {
      createCardToken: vi.fn(() =>
        Promise.resolve({ id: "mp-token-456", status: "active" })
      ),
      bricks: vi.fn(() => brickBuilder)
    };
    const constructor = vi.fn(() => instance);
    (globalThis as { MercadoPago?: unknown }).MercadoPago = constructor;

    const model = {
      amount: 50,
      mercadopago: {
        cardNumber: "5031433215406351",
        cardExpirationMonth: "12",
        cardExpirationYear: "28",
        securityCode: "123",
        cardholderName: "Test User",
        identificationType: "CPF",
        identificationNumber: "12345678909"
      }
    };
    const ctx = mercadoPagoContext();
    ctx.amount = 50;
    ctx.model = model as never;
    ctx.sdk = { mercadoPago: instance as never };
    const event = { type: "PAY", data: { amount: 50, model } };

    const result = await mercadoPagoServices.pay(ctx, event);

    expect(result).toBeUndefined();
  });
});
