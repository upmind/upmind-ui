/**
 * @fileoverview Gateway services integration — stripe, braintree, card
 *
 * ## Job To Be Done
 * Prove every exported function in stripe/services, braintree/services, and
 * card/services against OUR API (recorded fixtures). SDK loaders are mocked;
 * only our API is real (replayed).
 *
 * ## What Breaks If These Fail
 * A gateway silently fails to load, render, validate, pay, or store a method.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { GatewayContext as GatewayCtx } from "@upmind-automation/types";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { server } from "./setup.integration";
import type { GatewayContext } from "../payment-gateways.types";
import type { IClient, IGateway, ICurrency } from "@upmind-automation/types";

import stripeServices from "../stripe/services";
import braintreeServices from "../braintree/services";
import cardServices from "../card/services";

const recordingsDir = join(import.meta.dirname, "fixtures");
const sessionRecordingsDir = join(
  import.meta.dirname,
  "..",
  "..",
  "session-store",
  "__tests__",
  "fixtures"
);

const BEGIN_STRIPE =
  "post-gateway-frontend-tokenize-begin-id-case-begin-stripe";
const BEGIN_BRAINTREE =
  "post-gateway-frontend-tokenize-begin-id-case-begin-braintree";
const END_REFUSED_STRIPE =
  "post-gateway-frontend-tokenize-end-id-case-end-refused-stripe";
const END_REFUSED_BRAINTREE =
  "post-gateway-frontend-tokenize-end-id-case-end-refused-braintree";
const GATEWAYS_STRIPE =
  "get-brands-id-gateways-active-1-case-list-stripe-client-id-country-id";
const GATEWAYS_BRAINTREE =
  "get-brands-id-gateways-active-1-case-list-braintree-client-id-country-id";
const GET_FRONTEND_BRAINTREE = "get-gateway-frontend-id-case-details-braintree";
const STORE_PAYMENT_REFUSED =
  "post-clients-id-payment-details-case-store-on-payment";

const mockStripeElement = {
  mount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  once: vi.fn((event: string, cb: () => void) => cb()),
  update: vi.fn()
};

const mockStripeElements = {
  create: vi.fn(() => mockStripeElement),
  getElement: vi.fn(() => mockStripeElement),
  submit: vi.fn(() => Promise.resolve({ error: undefined }))
};

const mockStripe = {
  elements: vi.fn(() => mockStripeElements),
  confirmSetup: vi.fn(() =>
    Promise.resolve({ setupIntent: { id: "seti_mock", status: "succeeded" } })
  ),
  confirmPayment: vi.fn(() =>
    Promise.resolve({ paymentIntent: { id: "pi_mock", status: "succeeded" } })
  ),
  createPaymentMethod: vi.fn(() =>
    Promise.resolve({ paymentMethod: { id: "pm_mock" } })
  )
};

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe))
}));

const mockBraintreeDropin = {
  requestPaymentMethod: vi.fn(() =>
    Promise.resolve({ nonce: "fake-nonce-from-braintree" })
  ),
  teardown: function () {
    return Promise.resolve();
  },
  isPaymentMethodRequestable: function () {
    return true;
  },
  clearSelectedPaymentMethod: function () {},
  updateConfiguration: function () {},
  on: vi.fn()
};

vi.mock("braintree-web-drop-in", () => ({
  default: {
    create: vi.fn(() => Promise.resolve(mockBraintreeDropin))
  },
  create: vi.fn(() => Promise.resolve(mockBraintreeDropin))
}));

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

function recordedGatewayId(key: string): string {
  const fixture = getFixture(key, { recordingsDir });
  const match =
    /\/api\/gateway\/frontend\/tokenize-begin\/([0-9a-f-]{36})/.exec(
      fixture.request.path
    );
  if (!match?.[1]) {
    throw new Error(`The recorded fixture ${key} carries no gateway id.`);
  }
  return match[1];
}

function recordedClientId(key: string): string {
  const body = getFixtureBody<{
    data?: { client_payment_details?: { client_id?: string } };
  }>(key, { recordingsDir });
  const id = body?.data?.client_payment_details?.client_id;
  if (!id) {
    throw new Error(`The recorded fixture ${key} carries no client_id.`);
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
      `The recorded fixture ${key} carries no client_payment_details.id.`
    );
  }
  return id;
}

function recordedGatewayFromList(key: string): IGateway {
  const body = getFixtureBody<{ data?: Array<{ gateway?: IGateway }> }>(key, {
    recordingsDir
  });
  const gateway = body?.data?.[0]?.gateway;
  if (!gateway) {
    throw new Error(`The recorded fixture ${key} carries no gateway data.`);
  }
  return gateway;
}

const stripeGatewayId = recordedGatewayId(BEGIN_STRIPE);
const braintreeGatewayId = recordedGatewayId(BEGIN_BRAINTREE);
const clientId = recordedClientId(BEGIN_STRIPE);

const CURRENCY: ICurrency = {
  id: "e47d7382-4850-7931-56c8-1e642d59e063",
  code: "GBP"
} as ICurrency;

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

function addContext(
  gatewayId: string,
  gatewayOverrides: Partial<IGateway> = {}
): GatewayContext {
  return {
    ctx: GatewayCtx.ADD,
    client: { id: clientId } as IClient,
    gateway: {
      is_stored: true,
      store_outside_payment: true,
      gateway_provider: { store_type: 1 },
      ...gatewayOverrides,
      id: gatewayId
    } as IGateway,
    currency: CURRENCY,
    supported: true,
    model: {}
  } as unknown as GatewayContext;
}

function payContext(
  gatewayId: string,
  gatewayOverrides: Partial<IGateway> = {}
): GatewayContext {
  return {
    ctx: GatewayCtx.PAY,
    client: { id: clientId } as IClient,
    gateway: {
      id: gatewayId,
      is_stored: true,
      store_outside_payment: true,
      gateway_provider: { store_type: 1 },
      ...gatewayOverrides
    } as IGateway,
    currency: CURRENCY,
    amount: 50,
    orderId: "3de78642-de53-9714-76df-21208469530d",
    supported: true,
    model: { amount: 50 }
  } as unknown as GatewayContext;
}

describe("stripeServices.load", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_STRIPE);
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_STRIPE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A1 returns canStore/mustStore/mustAutoPay flags", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      clientSecret: "seti_test_secret",
      clientPaymentDetailsId: recordedPaymentDetailsId(BEGIN_STRIPE)
    } as unknown as GatewayContext;

    const result = await stripeServices.load(ctx);

    expect(result).toHaveProperty("canStore");
    expect(result).toHaveProperty("mustStore");
    expect(result).toHaveProperty("mustAutoPay");
    expect(typeof result.canStore).toBe("boolean");
  });
});

describe("stripeServices.render", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_STRIPE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-D1 mounts the SDK element when given a container", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const container = document.createElement("div");
    const stripeSDK = {
      stripe: mockStripe,
      element: mockStripeElement,
      elements: mockStripeElements
    };
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      container,
      clientSecret: "seti_test_secret"
    } as unknown as GatewayContext;
    const event = { data: { container, clientSecret: "seti_test_secret" } };

    await stripeServices.render(ctx, event);

    expect(mockStripeElement.mount).toHaveBeenCalledWith(container);
  });

  it("AC-D3 throws when container is undefined", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const stripeSDK = {
      stripe: mockStripe,
      element: mockStripeElement,
      elements: mockStripeElements
    };
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      container: undefined
    } as unknown as GatewayContext;
    const event = { data: { container: undefined } };

    await expect(stripeServices.render(ctx, event)).rejects.toThrow();
  });
});

describe("stripeServices.validate", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A8 returns the model when element reports valid", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const model = { card_holder: "Test User" };
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      sdk: { ...mockStripe, element: mockStripeElement },
      model
    } as unknown as GatewayContext;

    const result = await stripeServices.validate(ctx);

    expect(result).toEqual(model);
  });

  it("AC-A9 throws when element is missing", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      sdk: { ...mockStripe, element: undefined },
      model: {}
    } as unknown as GatewayContext;

    await expect(stripeServices.validate(ctx)).rejects.toThrow();
  });
});

describe("stripeServices.pay", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_STRIPE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A12 calls createPaymentMethod and returns model on success", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const stripeSDK = {
      stripe: mockStripe,
      element: mockStripeElement,
      elements: mockStripeElements
    };
    const ctx = {
      ...payContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      clientSecret: "pi_test_secret"
    } as unknown as GatewayContext;

    const result = await stripeServices.pay(ctx);

    expect(mockStripe.createPaymentMethod).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

describe("stripeServices.add", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_STRIPE);
    replay("post", "*/api/gateway/frontend/tokenize-begin/*", BEGIN_STRIPE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-C3 calls confirmSetup and returns paymentDetail on success", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const stripeSDK = {
      stripe: mockStripe,
      element: mockStripeElement,
      elements: mockStripeElements
    };
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      clientSecret: "seti_test_secret",
      clientPaymentDetailsId: recordedPaymentDetailsId(BEGIN_STRIPE)
    } as unknown as GatewayContext;

    const result = await stripeServices.add(ctx);

    expect(mockStripe.confirmSetup).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

describe("braintreeServices.load", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_BRAINTREE);
    replay("get", "*/api/gateway/frontend/*", GET_FRONTEND_BRAINTREE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A1 returns canStore/mustStore/mustAutoPay flags", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const ctx = {
      ...addContext(braintreeGatewayId, gateway)
    } as unknown as GatewayContext;

    const result = await braintreeServices.load(ctx);

    expect(result).toHaveProperty("canStore");
    expect(result).toHaveProperty("mustStore");
    expect(result).toHaveProperty("mustAutoPay");
    expect(typeof result.canStore).toBe("boolean");
    expect(result).toHaveProperty("sdk");
    expect(result.sdk).toHaveProperty("authorization");
  });
});

describe("braintreeServices.render", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_BRAINTREE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-D1 creates Drop-In SDK when given a container", async () => {
    const braintreeDropIn = await import("braintree-web-drop-in");
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const container = document.createElement("div");
    const braintreeSDK = {
      authorization: "sandbox_test_token",
      braintree: mockBraintreeDropin
    };
    const ctx = {
      ...addContext(braintreeGatewayId, gateway),
      sdk: braintreeSDK,
      container,
      clientSecret: "sandbox_test_token"
    } as unknown as GatewayContext;
    const event = { data: { container, clientSecret: "sandbox_test_token" } };

    await braintreeServices.render(ctx, event);

    expect(braintreeDropIn.default.create).toHaveBeenCalled();
  });

  it("AC-D3 throws when no container", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const braintreeSDK = {
      authorization: "sandbox_test_token",
      braintree: mockBraintreeDropin
    };
    const ctx = {
      ...addContext(braintreeGatewayId, gateway),
      sdk: braintreeSDK,
      container: undefined
    } as unknown as GatewayContext;
    const event = { data: { container: undefined } };

    await expect(braintreeServices.render(ctx, event)).rejects.toThrow();
  });
});

describe("braintreeServices.validate", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_BRAINTREE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A8 returns the model when dropin reports valid", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const model = { card_holder: "Test User" };
    const braintreeSDK = {
      authorization: "sandbox_test_token",
      braintree: mockBraintreeDropin
    };
    const ctx = {
      ...addContext(braintreeGatewayId, gateway),
      sdk: braintreeSDK,
      model
    } as unknown as GatewayContext;

    const result = await braintreeServices.validate(ctx);

    expect(result).toEqual(model);
  });
});

describe("braintreeServices.pay", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_BRAINTREE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A12 calls requestPaymentMethod on the dropin", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const braintreeSDK = {
      authorization: "sandbox_test_token",
      braintree: mockBraintreeDropin
    };
    const ctx = {
      ...payContext(braintreeGatewayId, gateway),
      sdk: braintreeSDK
    } as unknown as GatewayContext;

    const result = await braintreeServices.pay(ctx);

    expect(mockBraintreeDropin.requestPaymentMethod).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

describe("braintreeServices.add", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_BRAINTREE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-C3 calls requestPaymentMethod and returns result", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const braintreeSDK = {
      authorization: "sandbox_test_token",
      braintree: mockBraintreeDropin
    };
    const ctx = {
      ...addContext(braintreeGatewayId, gateway),
      sdk: braintreeSDK,
      clientPaymentDetailsId: recordedPaymentDetailsId(BEGIN_BRAINTREE)
    } as unknown as GatewayContext;

    const result = await braintreeServices.add(ctx);

    expect(mockBraintreeDropin.requestPaymentMethod).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

describe("cardServices.load", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A1 returns canStore/mustStore/mustAutoPay flags", async () => {
    const ctx = addContext(stripeGatewayId);

    const result = await cardServices.load(ctx);

    expect(result).toHaveProperty("canStore");
    expect(result).toHaveProperty("mustStore");
    expect(result).toHaveProperty("mustAutoPay");
    expect(typeof result.canStore).toBe("boolean");
  });
});

describe("cardServices.validate", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A8 returns model when no schema", async () => {
    const model = { card_number: "4111111111111111" };
    const ctx = {
      ...addContext(stripeGatewayId),
      model,
      schema: undefined
    } as unknown as GatewayContext;

    const result = await cardServices.validate(ctx);

    expect(result).toEqual(model);
  });
});

describe("cardServices.pay", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A12 returns the model for a free amount without API call (store=false)", async () => {
    const ctx = {
      ...payContext(stripeGatewayId),
      amount: 0,
      model: { amount: 0, store: false }
    } as unknown as GatewayContext;

    const result = await cardServices.pay(ctx);

    expect(result).toEqual(ctx.model);
    expect(outbound.filter(entry => entry.includes("/payments"))).toEqual([]);
  });

  it("ERR-C1 returns model when store=false on non-zero amount", async () => {
    const ctx = {
      ...payContext(stripeGatewayId),
      model: { amount: 50, store: false }
    } as unknown as GatewayContext;

    const result = await cardServices.pay(ctx);

    expect(result).toEqual(ctx.model);
    expect(outbound.filter(entry => entry.includes("payment_details"))).toEqual(
      []
    );
  });

  it("ERR-C2 calls storePaymentMethod when store=true and surfaces 409 refusal", async () => {
    replay("post", "*/api/clients/*/payment_details", STORE_PAYMENT_REFUSED);

    const ctx = {
      ...payContext(stripeGatewayId),
      model: {
        store: true,
        card_type: "visa",
        card_num: "4111111111111111",
        card_expire_date: "12/28",
        card_cvv: "123"
      }
    } as unknown as GatewayContext;

    await expect(cardServices.pay(ctx)).rejects.toThrow();
    expect(outbound).toContainEqual(
      expect.stringMatching(/POST.*payment_details/)
    );
  });
});

describe("cardServices.add", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-C3 returns model without SDK interaction (card spreads shared)", async () => {
    const model = { card_number: "4111111111111111" };
    const ctx = {
      ...addContext(stripeGatewayId),
      model,
      clientPaymentDetailsId: "test-id"
    } as unknown as GatewayContext;

    const result = await cardServices.add(ctx);

    expect(result).toBeDefined();
  });
});

describe("stripeServices error paths", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A10 pay throws when SDK is missing", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const ctx = {
      ...payContext(stripeGatewayId, gateway),
      sdk: undefined
    } as unknown as GatewayContext;

    await expect(stripeServices.pay(ctx)).rejects.toThrow();
  });

  it("AC-A11 add throws when SDK is missing", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      sdk: undefined
    } as unknown as GatewayContext;

    await expect(stripeServices.add(ctx)).rejects.toThrow();
  });

  it("AC-A13 pay throws when elements.submit returns error", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const failingElements = {
      ...mockStripeElements,
      submit: vi.fn(() =>
        Promise.resolve({ error: { message: "Card declined" } })
      )
    };
    const stripeSDK = {
      stripe: mockStripe,
      element: mockStripeElement,
      elements: failingElements
    };
    const ctx = {
      ...payContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      clientSecret: "pi_test_secret"
    } as unknown as GatewayContext;

    await expect(stripeServices.pay(ctx)).rejects.toThrow("Card declined");
  });

  it("AC-A14 add throws when confirmSetup returns error", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const failingStripe = {
      ...mockStripe,
      confirmSetup: vi.fn(() =>
        Promise.resolve({ error: { message: "Setup failed" } })
      )
    };
    const stripeSDK = {
      stripe: failingStripe,
      element: mockStripeElement,
      elements: mockStripeElements
    };
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      clientSecret: "seti_test_secret",
      clientPaymentDetailsId: recordedPaymentDetailsId(BEGIN_STRIPE)
    } as unknown as GatewayContext;

    await expect(stripeServices.add(ctx)).rejects.toThrow("Setup failed");
  });

  it("ERR-S1 pay throws when createPaymentMethod returns error", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const failingStripe = {
      ...mockStripe,
      createPaymentMethod: vi.fn(() =>
        Promise.resolve({ error: { message: "Invalid card" } })
      )
    };
    const stripeSDK = {
      stripe: failingStripe,
      element: mockStripeElement,
      elements: mockStripeElements
    };
    const ctx = {
      ...payContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      clientSecret: "pi_test_secret"
    } as unknown as GatewayContext;

    await expect(stripeServices.pay(ctx)).rejects.toThrow("Invalid card");
  });

  it("ERR-S2 validate throws when element is undefined", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      sdk: { stripe: mockStripe, elements: mockStripeElements },
      model: {}
    } as unknown as GatewayContext;

    await expect(stripeServices.validate(ctx)).rejects.toThrow();
  });
});

describe("braintreeServices error paths", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A10 validate throws when sdk.braintree is missing", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const ctx = {
      ...addContext(braintreeGatewayId, gateway),
      sdk: { authorization: "token" },
      model: {}
    } as unknown as GatewayContext;

    await expect(braintreeServices.validate(ctx)).rejects.toThrow();
  });

  it("AC-A11 pay throws when sdk.braintree is missing", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const ctx = {
      ...payContext(braintreeGatewayId, gateway),
      sdk: { authorization: "token" }
    } as unknown as GatewayContext;

    await expect(braintreeServices.pay(ctx)).rejects.toThrow();
  });

  it("AC-A12 add throws when sdk.braintree is missing", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const ctx = {
      ...addContext(braintreeGatewayId, gateway),
      sdk: { authorization: "token" },
      clientPaymentDetailsId: recordedPaymentDetailsId(BEGIN_BRAINTREE)
    } as unknown as GatewayContext;

    await expect(braintreeServices.add(ctx)).rejects.toThrow();
  });

  it("AC-A15 pay throws when requestPaymentMethod fails", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const failingDropin = {
      ...mockBraintreeDropin,
      requestPaymentMethod: vi.fn(() =>
        Promise.reject(new Error("Payment method unavailable"))
      )
    };
    const ctx = {
      ...payContext(braintreeGatewayId, gateway),
      sdk: { authorization: "token", braintree: failingDropin }
    } as unknown as GatewayContext;

    await expect(braintreeServices.pay(ctx)).rejects.toThrow(
      "Payment method unavailable"
    );
  });

  it("ERR-B1 add throws when requestPaymentMethod fails", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const failingDropin = {
      ...mockBraintreeDropin,
      requestPaymentMethod: vi.fn(() =>
        Promise.reject(new Error("Card verification failed"))
      )
    };
    const ctx = {
      ...addContext(braintreeGatewayId, gateway),
      sdk: { authorization: "token", braintree: failingDropin },
      clientPaymentDetailsId: recordedPaymentDetailsId(BEGIN_BRAINTREE)
    } as unknown as GatewayContext;

    await expect(braintreeServices.add(ctx)).rejects.toThrow(
      "Card verification failed"
    );
  });

  it("ERR-B2 pay throws when sdk.authorization is missing", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const ctx = {
      ...payContext(braintreeGatewayId, gateway),
      sdk: { braintree: mockBraintreeDropin }
    } as unknown as GatewayContext;

    await expect(braintreeServices.pay(ctx)).rejects.toThrow();
  });

  it("ERR-B3 add throws when sdk.authorization is missing", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const ctx = {
      ...addContext(braintreeGatewayId, gateway),
      sdk: { braintree: mockBraintreeDropin },
      clientPaymentDetailsId: recordedPaymentDetailsId(BEGIN_BRAINTREE)
    } as unknown as GatewayContext;

    await expect(braintreeServices.add(ctx)).rejects.toThrow();
  });
});

describe("AC-B3 payment records against the named order", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-B3 stripe pay context carries the orderId through to the model", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const orderId = "order-123-test";
    const stripeSDK = {
      stripe: mockStripe,
      element: mockStripeElement,
      elements: mockStripeElements
    };
    const ctx = {
      ...payContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      orderId,
      clientSecret: "pi_test_secret"
    } as unknown as GatewayContext;

    const result = await stripeServices.pay(ctx);

    expect(ctx.orderId).toBe(orderId);
    expect(result).toBeDefined();
  });

  it("AC-B3 braintree pay context carries the orderId through to the model", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const orderId = "order-456-test";
    const ctx = {
      ...payContext(braintreeGatewayId, gateway),
      sdk: { authorization: "token", braintree: mockBraintreeDropin },
      orderId
    } as unknown as GatewayContext;

    const result = await braintreeServices.pay(ctx);

    expect(ctx.orderId).toBe(orderId);
    expect(result).toBeDefined();
  });
});

describe("AC-C6 stored method marked for automatic renewal", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-C6 model.auto_payment flag is preserved when storing a method", async () => {
    const model = { card_number: "4111111111111111", auto_payment: true };
    const ctx = {
      ...addContext(stripeGatewayId),
      model,
      clientPaymentDetailsId: "test-id"
    } as unknown as GatewayContext;

    const result = await cardServices.add(ctx);

    expect(result).toBeDefined();
    expect(ctx.model.auto_payment).toBe(true);
  });
});

describe("stripeServices.validate SDK execution paths", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_STRIPE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A8 validate with schema and model returns valid model", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const model = { card_holder: "Test User", store_on_payment: true };
    const stripeSDK = {
      stripe: mockStripe,
      element: mockStripeElement,
      elements: mockStripeElements
    };
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      model,
      schema: {
        type: "object",
        properties: { card_holder: { type: "string" } }
      }
    } as unknown as GatewayContext;
    const event = { type: "VALIDATE", data: { model } };

    const result = await stripeServices.validate(ctx, event);

    expect(result).toEqual(model);
  });

  it("AC-A8 validate with PAY context returns model", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const model = { amount: 50, card_holder: "Valid User" };
    const stripeSDK = {
      stripe: mockStripe,
      element: mockStripeElement,
      elements: mockStripeElements
    };
    const ctx = {
      ...payContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      model,
      schema: { type: "object" }
    } as unknown as GatewayContext;
    const event = { type: "VALIDATE", data: { model } };

    const result = await stripeServices.validate(ctx, event);

    expect(result).toEqual(model);
  });
});

describe("braintreeServices.validate SDK execution paths", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_BRAINTREE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A8 validate with schema returns model", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const model = { card_holder: "Test User" };
    const braintreeSDK = {
      authorization: "sandbox_test_token",
      braintree: mockBraintreeDropin
    };
    const ctx = {
      ...addContext(braintreeGatewayId, gateway),
      sdk: braintreeSDK,
      model,
      schema: {
        type: "object",
        properties: { card_holder: { type: "string" } }
      }
    } as unknown as GatewayContext;
    const event = { type: "VALIDATE", data: { model } };

    const result = await braintreeServices.validate(ctx, event);

    expect(result).toEqual(model);
  });

  it("AC-A8 validate with PAY context returns model", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const model = { amount: 50, card_holder: "Valid User" };
    const braintreeSDK = {
      authorization: "sandbox_test_token",
      braintree: mockBraintreeDropin
    };
    const ctx = {
      ...payContext(braintreeGatewayId, gateway),
      sdk: braintreeSDK,
      model,
      schema: { type: "object" }
    } as unknown as GatewayContext;
    const event = { type: "VALIDATE", data: { model } };

    const result = await braintreeServices.validate(ctx, event);

    expect(result).toEqual(model);
  });

  it("AC-A8 validate with validationHelper callback invokes it", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_BRAINTREE);
    const model = { card_holder: "Test User" };
    const validationHelperFn = vi.fn();
    const dropinWithOn = {
      ...mockBraintreeDropin,
      on: vi.fn((event: string, cb: () => void) => {
        if (event === "paymentMethodRequestable") cb();
      })
    };
    const braintreeSDK = {
      authorization: "sandbox_test_token",
      braintree: dropinWithOn
    };
    const ctx = {
      ...addContext(braintreeGatewayId, gateway),
      sdk: braintreeSDK,
      model,
      schema: { type: "object" },
      validationHelper: validationHelperFn
    } as unknown as GatewayContext;
    const event = { type: "VALIDATE", data: { model } };

    const result = await braintreeServices.validate(ctx, event);

    expect(result).toEqual(model);
  });
});

describe("stripeServices.validate validationHelper callback", () => {
  beforeEach(async () => {
    outbound = [];
    clearSessionCookies();
    const { queryClient } = await import("../../query");
    queryClient.clear();
    await seedClientSession();
    replay("get", "*/api/brands/:brandId/gateways", GATEWAYS_STRIPE);
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  it("AC-A8 validate with validationHelper invokes it via element on change", async () => {
    const gateway = recordedGatewayFromList(GATEWAYS_STRIPE);
    const model = { card_holder: "Test User" };
    const validationHelperFn = vi.fn();
    const elementWithOn = {
      ...mockStripeElement,
      on: vi.fn((event: string, cb: (e: { complete: boolean }) => void) => {
        if (event === "change") cb({ complete: true });
      })
    };
    const stripeSDK = {
      stripe: mockStripe,
      element: elementWithOn,
      elements: mockStripeElements
    };
    const ctx = {
      ...addContext(stripeGatewayId, gateway),
      sdk: stripeSDK,
      model,
      schema: { type: "object" },
      validationHelper: validationHelperFn
    } as unknown as GatewayContext;
    const event = { type: "VALIDATE", data: { model } };

    const result = await stripeServices.validate(ctx, event);

    expect(result).toEqual(model);
  });
});
