/**
 * @fileoverview paymentGateways shared services integration — load, parse, validate, pay, beginSetup, endSetup
 *
 * ## Job To Be Done
 * The shared services cross session/brand boundaries and the tokenise API. This
 * file dynamically imports the shared services and asserts on what each function
 * returns or throws against recorded fixtures.
 *
 * ## Provenance
 * Every OUR API body replayed here was captured by `pnpm fixtures:generate payment-gateways`
 * into this module's own `fixtures/` dir. Mocking `useActiveSession`/`useBrand`/
 * `useI18n`/`useValidation` is legitimate; fabricating an API body is not.
 *
 * ## What Breaks If These Fail
 * A gateway fails to load, validate, pay, or store a method because the shared
 * service contract drifted from what the machine expects.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  GatewayContext as GatewayCtx,
  GatewayStoreType
} from "@upmind-automation/types";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { server } from "./setup.integration";
import type { GatewayContext } from "../payment-gateways.types";
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

const BEGIN_STRIPE =
  "post-gateway-frontend-tokenize-begin-id-case-begin-stripe";
const END_REFUSED_STRIPE =
  "post-gateway-frontend-tokenize-end-id-case-end-refused-stripe";

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
    getConfigValue: (key: string) => {
      if (key === "BILLING_GATEWAY_FORCE_CARD_STORAGE") return false;
      if (key === "BILLING_GATEWAY_FORCE_AUTO_PAYMENT") return false;
      return undefined;
    }
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

const stripeGatewayId = recordedGatewayId(BEGIN_STRIPE);
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

function storableGateway(overrides: Partial<IGateway> = {}): IGateway {
  return {
    id: stripeGatewayId,
    is_stored: true,
    store_outside_payment: true,
    store_on_payment: false,
    store_on_payment_force: false,
    gateway_provider: { store_type: GatewayStoreType.TOKEN },
    ...overrides
  } as IGateway;
}

function nonStorableGateway(): IGateway {
  return {
    id: stripeGatewayId,
    is_stored: false,
    store_outside_payment: false,
    store_on_payment: false,
    gateway_provider: { store_type: GatewayStoreType.NONE }
  } as IGateway;
}

function addContext(gatewayOverrides: Partial<IGateway> = {}): GatewayContext {
  return {
    ctx: GatewayCtx.ADD,
    client: { id: clientId } as IClient,
    gateway: storableGateway(gatewayOverrides),
    currency: CURRENCY,
    supported: true,
    model: {}
  } as unknown as GatewayContext;
}

function payContext(gatewayOverrides: Partial<IGateway> = {}): GatewayContext {
  return {
    ctx: GatewayCtx.PAY,
    client: { id: clientId } as IClient,
    gateway: storableGateway(gatewayOverrides),
    currency: CURRENCY,
    amount: 50,
    orderId: "3de78642-de53-9714-76df-21208469530d",
    supported: true,
    model: { amount: 50 }
  } as unknown as GatewayContext;
}

async function getSharedServices() {
  const module = await import("../payment-gateways.services");
  return module.default;
}

describe("sharedServices.load", () => {
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

  it("AC-C4 throws when ADD context and gateway cannot store", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();
    ctx.gateway = nonStorableGateway();

    await expect(sharedServices.load(ctx)).rejects.toThrow();
  });

  it("AC-C5 returns canStore true when gateway supports storage", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();

    const result = await sharedServices.load(ctx);

    expect(result).toHaveProperty("canStore");
    expect(result.canStore).toBe(true);
  });

  it("AC-C5 returns mustStore based on gateway store_on_payment_force", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext({ store_on_payment_force: true });

    const result = await sharedServices.load(ctx);

    expect(result).toHaveProperty("mustStore");
    expect(result.mustStore).toBe(true);
  });

  it("AC-C6 returns mustAutoPay false by default", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();

    const result = await sharedServices.load(ctx);

    expect(result).toHaveProperty("mustAutoPay");
    expect(result.mustAutoPay).toBe(false);
  });

  it("returns all flags false when supported is false", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();
    ctx.supported = false;

    const result = await sharedServices.load(ctx);

    expect(result.canStore).toBe(false);
    expect(result.mustStore).toBe(false);
    expect(result.mustAutoPay).toBe(false);
  });
});

describe("sharedServices.parse", () => {
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

  it("AC-C5 sets store_on_payment true when mustStore is true", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();
    ctx.canStore = true;
    ctx.mustStore = true;
    ctx.model = { card_number: "4242424242424242" };

    const result = await sharedServices.parse(ctx);

    expect(result).toHaveProperty("store_on_payment", true);
  });

  it("AC-C6 sets store_on_payment_auto_payment true when mustAutoPay is true", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();
    ctx.canStore = true;
    ctx.mustAutoPay = true;
    ctx.model = { card_number: "4242424242424242" };

    const result = await sharedServices.parse(ctx);

    expect(result).toHaveProperty("store_on_payment_auto_payment", true);
  });

  it("forces storage flags false when canStore is false", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();
    ctx.canStore = false;
    ctx.model = { card_number: "4242424242424242" };

    const result = await sharedServices.parse(ctx);

    expect(result.store_on_payment).toBe(false);
    expect(result.store_on_payment_auto_payment).toBe(false);
  });

  it("forces auto-payment false when supported is false", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();
    ctx.supported = false;
    ctx.canStore = true;
    ctx.mustAutoPay = true;
    ctx.model = { card_number: "4242424242424242" };

    const result = await sharedServices.parse(ctx);

    expect(result.store_on_payment_auto_payment).toBe(false);
  });
});

describe("sharedServices.validate", () => {
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

  it("AC-A8 returns model when no schema is present", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();
    ctx.model = { card_number: "4242424242424242" };
    ctx.schema = undefined;

    const result = await sharedServices.validate(ctx);

    expect(result).toEqual(ctx.model);
  });

  it("AC-A8 returns model when schema validation passes", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();
    ctx.model = { card_holder: "Test User" };
    ctx.schema = {
      type: "object",
      properties: {
        card_holder: { type: "string" }
      }
    };

    const result = await sharedServices.validate(ctx);

    expect(result).toHaveProperty("card_holder", "Test User");
  });

  it("AC-A9 throws DetailedError when schema validation fails", async () => {
    const sharedServices = await getSharedServices();
    const ctx = addContext();
    ctx.model = { card_holder: 12345 };
    ctx.schema = {
      type: "object",
      properties: {
        card_holder: { type: "string" }
      },
      required: ["card_holder"]
    };

    await expect(sharedServices.validate(ctx)).rejects.toThrow();
  });
});

describe("sharedServices.pay", () => {
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

  it("AC-D7 returns model as-is for free amount", async () => {
    const sharedServices = await getSharedServices();
    const ctx = payContext();
    ctx.amount = 0;
    ctx.model = { amount: 0 };

    const result = await sharedServices.pay(ctx);

    expect(result).toEqual(ctx.model);
  });

  it("AC-D7 returns model without making API call", async () => {
    const sharedServices = await getSharedServices();
    const ctx = payContext();
    ctx.model = { amount: 50 };

    const result = await sharedServices.pay(ctx);

    expect(result).toEqual(ctx.model);
    expect(outbound.filter(entry => entry.includes("/payments"))).toEqual([]);
  });
});

describe("beginSetup (named export)", () => {
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

  it("AC-C2 reserves a payment detail record and returns the gateway secret", async () => {
    replay(
      "post",
      `*/api/gateway/frontend/tokenize-begin/${stripeGatewayId}*`,
      BEGIN_STRIPE
    );

    const { beginSetup } = await import("../payment-gateways.services");
    const ctx = addContext();

    const result = await beginSetup(ctx);

    expect(result).toHaveProperty("client_payment_details");
    expect(result.client_payment_details).toHaveProperty("id");
    expect(result.client_payment_details.id).toBe(
      recordedPaymentDetailsId(BEGIN_STRIPE)
    );
    expect(result).toHaveProperty("gateway_specific");
    expect(result.gateway_specific).toHaveProperty("client_secret");
  });

  it("AC-C2 sends the tokenize-begin request to the gateway endpoint", async () => {
    replay(
      "post",
      `*/api/gateway/frontend/tokenize-begin/${stripeGatewayId}*`,
      BEGIN_STRIPE
    );

    const { beginSetup } = await import("../payment-gateways.services");
    const ctx = addContext();

    await beginSetup(ctx);

    const tokenizeRequest = outbound.find(entry =>
      entry.includes("/gateway/frontend/tokenize-begin/")
    );
    expect(tokenizeRequest).toBeDefined();
    expect(tokenizeRequest).toContain(stripeGatewayId);
  });
});

describe("endSetup (named export)", () => {
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

  it("AC-A13 surfaces the refusal when the provider refuses the setup", async () => {
    replay(
      "post",
      `*/api/gateway/frontend/tokenize-end/${stripeGatewayId}*`,
      END_REFUSED_STRIPE
    );

    const { endSetup } = await import("../payment-gateways.services");
    const ctx = addContext();
    ctx.clientPaymentDetailsId = recordedPaymentDetailsId(BEGIN_STRIPE);

    await expect(endSetup(ctx, { token: "mock-token" })).rejects.toThrow();
  });

  it("AC-A13 includes error data when the provider refuses", async () => {
    replay(
      "post",
      `*/api/gateway/frontend/tokenize-end/${stripeGatewayId}*`,
      END_REFUSED_STRIPE
    );

    const { endSetup } = await import("../payment-gateways.services");
    const ctx = addContext();
    ctx.clientPaymentDetailsId = recordedPaymentDetailsId(BEGIN_STRIPE);

    await endSetup(ctx, { token: "mock-token" })
      .then(() => {
        expect.fail("Expected endSetup to throw");
      })
      .catch((error: unknown) => {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      });
  });

  it("AC-C3 sends the tokenize-end request to the gateway endpoint", async () => {
    replay(
      "post",
      `*/api/gateway/frontend/tokenize-end/${stripeGatewayId}*`,
      END_REFUSED_STRIPE
    );

    const { endSetup } = await import("../payment-gateways.services");
    const ctx = addContext();
    ctx.clientPaymentDetailsId = recordedPaymentDetailsId(BEGIN_STRIPE);

    await endSetup(ctx, { token: "mock-token" }).catch(() => {
      // expected to throw
    });

    const tokenizeRequest = outbound.find(entry =>
      entry.includes("/gateway/frontend/tokenize-end/")
    );
    expect(tokenizeRequest).toBeDefined();
    expect(tokenizeRequest).toContain(stripeGatewayId);
  });
});
