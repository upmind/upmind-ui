// -----------------------------------------------------------------------------
/**
 * @fileoverview paymentDetails Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real endpoints the `payment-details` module hits and (re)generate
 * their sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir
 * — the same files `payment-details.*.int.test.ts` replays through MSW. Run on
 * demand:
 *
 *   pnpm fixtures:generate payment-details
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so the `*.fixtures.ts` suffix keeps it out of the `*.test.ts` /
 * `*.int.test.ts` suites (see the package vitest configs). It has no assertions:
 * an `it()` succeeds when the capture completes.
 *
 * ## What this generator will NOT capture, and why
 * A tokenise-END success is minted by a gateway SDK running in a browser — the
 * token is single-use and cannot be forged from Node. This generator captures
 * tokenise-BEGIN's real payload and tokenise-END's REFUSAL shape only; the
 * cleared-capture scenarios (AC-B5, AC-B8) therefore have no fixture from here.
 * They need a gateway-sandbox capture through the app-driven recorder, owed on
 * FE-3130 and NEVER substituted with a hand-written body.
 *
 * Blocked on the recording environment rather than on this module, owed on
 * FE-3130:
 * - the raw-card STORE success — this brand's store-capable gateway is
 *   Stripe with the frontend implementation, so the server-side create is
 *   refused 409 by design; the refusal is what is captured;
 * - the successful REMOVAL (AC-B12) — it needs a method this generator created,
 *   which the line above prevents. Deleting one of the recording client's real
 *   methods is not a substitute;
 * - the successful PROMOTE-TO-DEFAULT and RENEWAL-CHARGING writes (AC-B14,
 *   AC-B15) — the route refuses PATCH with 405 and names PUT, and a partial PUT
 *   against one of the recording client's 13 real methods could blank its other
 *   fields. The 405 is captured; the success shape is owed.
 *
 * ## Re-runnability
 * Every capture here is a read or a no-op write (the two PATCHes restate the
 * value the record already holds), so a re-run neither litters the recording
 * client nor moves its default.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set it " +
          'in .env.recording). Without it every call returns 404 "Domain not found!".'
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

/** The relations the stored-method listing asks for. */
const STORED_WITH = ["gateway", "client"].join();

/** The relations the gateway lookup asks for. */
const GATEWAY_WITH = ["gateway.gateway_provider", "gateway.card_types"].join();

/** A client id that exists in no brand — the forbidden-read control. */
const FOREIGN_CLIENT = "00000000-0000-0000-0000-000000000000";

/**
 * The PAN every gateway sandbox publishes as its always-approve card. It is a
 * published test number, not a real instrument, and the Generator sanitises the
 * request body before it reaches disk.
 */
const TEST_CARD = {
  card_type: "visa",
  card_num: "4111111111111111",
  card_expire_date: "12/2030",
  card_cvv: "123",
  cardholder_name: "Fixture Recorder",
  name: "Visa ending 1111"
};

/** Read a real value off the live API without buffering a capture for it. */
async function readLive<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      Origin: ORIGIN
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`GET ${path} returned ${response.status}`);
  return (body?.data ?? body) as T;
}

/** Drop a buffered capture whose recorded path carries the given case tag. */
function dropCapture(generator: Generator, caseTag: string): void {
  const captures = generator.getCapturedFixtures();
  for (const [key, { fixture }] of captures) {
    if (fixture.request.path.includes(`case=${caseTag}`)) captures.delete(key);
  }
}

type GatewayRow = {
  gateway_id?: string;
  gateway?: {
    use_frontend_implementation?: boolean;
    store_outside_payment?: boolean;
    gateway_provider?: { code?: string };
  };
};

// -----------------------------------------------------------------------------

describe("paymentDetails API Fixtures Generator", () => {
  let generator: Generator;
  let token: IToken;
  let brandId: string;
  let clientId: string;
  let addressId: string | undefined;
  let countryId: string | undefined;
  let currencyId: string | undefined;
  let currencyCode = "USD";
  let storeGateways: GatewayRow[] = [];
  let defaultMethod:
    | { id?: string; default?: boolean; auto_payment?: boolean }
    | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "payment-details"
    });

    token = await mintClientToken();
    generator.setBearerToken(token.access_token);

    const self = await readLive<{
      id?: string;
      actor?: { id?: string; brand_id?: string };
    }>("/api/self?with=actor,actor.brand", token.access_token);

    brandId = self?.actor?.brand_id ?? "";
    clientId = self?.actor?.id ?? self?.id ?? "";

    if (!brandId || !clientId) {
      throw new Error(
        "Could not resolve a brand id and client id from /api/self — the " +
          "stored-method and gateway endpoints are scoped to both."
      );
    }

    type AddressRow = { id?: string; country_id?: string };
    const addresses = await readLive<AddressRow[]>(
      `/api/clients/${clientId}/addresses?limit=5`,
      token.access_token
    );
    const address = (Array.isArray(addresses) ? addresses : [])[0];
    addressId = address?.id;
    countryId = address?.country_id;

    if (!addressId) {
      throw new Error(
        "The recording client holds no address, so no card can be stored " +
          "against it — a direct card create requires address_id."
      );
    }

    type CurrencyRow = { id?: string; code?: string; base?: boolean };
    const currencies = await readLive<CurrencyRow[]>(
      "/api/currencies?limit=0",
      token.access_token
    );
    const rows = Array.isArray(currencies) ? currencies : [];
    const currency = rows.find(row => row.code === currencyCode) ?? rows[0];
    currencyId = currency?.id;
    currencyCode = currency?.code ?? currencyCode;

    if (!currencyId) {
      throw new Error(
        "Could not resolve a currency from /api/currencies — the gateway list " +
          "and the amount formatter are both currency-scoped."
      );
    }

    const addParams = new URLSearchParams({
      limit: "0",
      order: "order",
      active: "1",
      client_id: clientId,
      currency_code: currencyCode,
      with: GATEWAY_WITH
    });
    if (countryId) addParams.set("country_id", countryId);

    const gateways = await readLive<GatewayRow[]>(
      `/api/brands/${brandId}/gateways?${addParams.toString()}`,
      token.access_token
    );

    storeGateways = (Array.isArray(gateways) ? gateways : []).filter(
      row => row.gateway?.store_outside_payment && row.gateway_id
    );

    type StoredRow = { id?: string; default?: boolean; auto_payment?: boolean };
    const stored = await readLive<StoredRow[] | Record<string, StoredRow>>(
      `/api/clients/${clientId}/payment_details?limit=0&order=-default,id`,
      token.access_token
    );
    const storedRows = Object.values(stored ?? {}) as StoredRow[];
    defaultMethod = storedRows.find(row => row.default) ?? storedRows[0];

    // Minted per-capture, not here: the staff credentials are currently refused
    // by this brand (401, FE-3130), and one dead actor must not skip the whole
    // client-side capture set.
  }, 90000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/clients/{id}/payment_details — the methods on file (AC-A1)", async () => {
    const params = new URLSearchParams({
      limit: "0",
      active: "true",
      brand_id: brandId,
      currency_code: currencyCode,
      order: "-default,id",
      with: STORED_WITH
    });
    if (countryId) params.set("country_id", countryId);

    await generator.get(
      `/api/clients/${clientId}/payment_details?${params.toString()}`
    );
  });

  it("captures GET /api/clients/{id}/payment_details for a client that is not mine (AC-A17)", async () => {
    await generator.get(
      `/api/clients/${FOREIGN_CLIENT}/payment_details?case=not-mine&limit=0&with=${STORED_WITH}`
    );
  });

  it("captures GET /api/clients/{id}/payment_details with no token at all (AC-G1)", async () => {
    await generator.get(
      `/api/clients/${clientId}/payment_details?case=signed-out&limit=0&with=${STORED_WITH}`,
      { Authorization: "" }
    );
  });

  it("captures GET /api/brands/{id}/gateways in the PAY context (AC-A2)", async () => {
    const params = new URLSearchParams({
      case: "pay",
      limit: "0",
      order: "order",
      active: "1",
      client_id: clientId,
      currency_code: currencyCode,
      with: GATEWAY_WITH
    });
    if (countryId) params.set("country_id", countryId);

    await generator.get(`/api/brands/${brandId}/gateways?${params.toString()}`);
  });

  it("captures GET /api/brands/{id}/gateways for a currency the brand does not take (AC-A14)", async () => {
    const params = new URLSearchParams({
      case: "currency-unsupported",
      limit: "0",
      order: "order",
      active: "1",
      client_id: clientId,
      currency_code: "JPY",
      with: GATEWAY_WITH
    });

    await generator.get(`/api/brands/${brandId}/gateways?${params.toString()}`);
  });

  it("captures GET /api/brands/{id}/gateways in the ADD context (AC-B1)", async () => {
    const params = new URLSearchParams({
      case: "add",
      limit: "0",
      order: "order",
      active: "1",
      client_id: clientId,
      currency_code: currencyCode,
      with: GATEWAY_WITH
    });
    if (countryId) params.set("country_id", countryId);

    await generator.get(`/api/brands/${brandId}/gateways?${params.toString()}`);
  });

  it("captures GET /api/wallet/balance — the credit on the account (AC-A3)", async () => {
    await generator.get(`/api/wallet/balance?currency_code=${currencyCode}`);
  });

  it("captures POST /api/cart/calculate — an amount read back as money (AC-A13)", async () => {
    await generator.post("/api/cart/calculate", {
      currency_id: currencyId,
      prices: [12.5, 7.49]
    });
  });

  // The capture surface formats THREE amounts independently — what is being
  // paid, what is outstanding, and what the credit covers. One recorded response
  // cannot stand in for three different price lists, so each gets its own.
  it("captures POST /api/cart/calculate for the amount being paid (AC-A13)", async () => {
    await generator.post("/api/cart/calculate?case=amount", {
      currency_id: currencyId,
      prices: [30]
    });
  });

  it("captures POST /api/cart/calculate for the outstanding balance (AC-A13)", async () => {
    await generator.post("/api/cart/calculate?case=outstanding", {
      currency_id: currencyId,
      prices: [50]
    });
  });

  it("captures POST /api/cart/calculate for the credit contribution (AC-A13)", async () => {
    await generator.post("/api/cart/calculate?case=wallet", {
      currency_id: currencyId,
      prices: [20]
    });
  });

  // Kept as the receipt that the endpoint IGNORES `amount`: this capture and the
  // 50.00 one return the same 15 rows, so there is no amount-driven narrowing to
  // test and the module's contract carries no scenario for one.
  it("captures POST /api/cart/calculate for a small credit contribution (AC-A13)", async () => {
    await generator.post("/api/cart/calculate?case=wallet-small", {
      currency_id: currencyId,
      prices: [5]
    });
  });

  it("captures GET /api/brands/{id}/gateways at a tiny amount — identical to the full one", async () => {
    const params = new URLSearchParams({
      case: "tiny-amount",
      limit: "0",
      order: "order",
      active: "1",
      client_id: clientId,
      currency_code: currencyCode,
      amount: "0.20",
      with: GATEWAY_WITH
    });
    if (countryId) params.set("country_id", countryId);

    await generator.get(`/api/brands/${brandId}/gateways?${params.toString()}`);
  });

  it("captures POST /api/clients/{id}/payment_details refused on a frontend-only gateway (AC-B6)", async () => {
    const { status } = await generator.post(
      `/api/clients/${clientId}/payment_details?case=raw-card-refused`,
      {
        ...TEST_CARD,
        address_id: addressId,
        gateway_id: storeGateways[0]?.gateway_id,
        return_url: `${ORIGIN}/payment/return`,
        auto_payment: true
      }
    );

    if (status < 400) {
      throw new Error(
        "The raw-card create SUCCEEDED on this brand, so it stored a real " +
          "method that this generator did not expect and cannot clean up. " +
          "Re-point the capture at the success shape and delete the method."
      );
    }
  });

  it("captures PATCH /api/clients/{id}/payment_details/{id} — the method the docs name, refused (AC-B14)", async () => {
    if (!defaultMethod?.id) {
      throw new Error(
        "The recording client holds no stored method, so the " +
          "promote-to-default response cannot be captured and is not invented."
      );
    }

    // The module docs name PATCH for this; the route answers 405 and names
    // GET, HEAD, PUT, DELETE. The refusal is the reality captured here — the
    // PUT success shape is owed on FE-3130, because a partial PUT against one
    // of the recording client's 13 real methods could blank its other fields.
    await generator.patch(
      `/api/clients/${clientId}/payment_details/${defaultMethod.id}?case=set-default`,
      { default: true }
    );
  });

  it("captures PATCH /api/clients/{id}/payment_details/{id} — renewal charging, refused the same way (AC-B15)", async () => {
    if (!defaultMethod?.id) {
      throw new Error(
        "The recording client holds no stored method, so the renewal-charging " +
          "response cannot be captured and is not invented."
      );
    }

    await generator.patch(
      `/api/clients/${clientId}/payment_details/${defaultMethod.id}?case=auto-payment`,
      { auto_payment: !!defaultMethod.auto_payment }
    );
  });

  it("captures POST tokenize-begin — what a gateway's own flow needs (AC-B4)", async () => {
    const sdkGateway = storeGateways.find(
      row => row.gateway?.use_frontend_implementation
    );

    if (!sdkGateway?.gateway_id) {
      throw new Error(
        "This brand offers no gateway that runs its own capture flow, so the " +
          "tokenise-begin payload cannot be captured. Enable one on the " +
          "recording brand."
      );
    }

    await generator.post(
      `/api/gateway/frontend/tokenize-begin/${sdkGateway.gateway_id}`,
      {
        client_id: clientId,
        currency_id: currencyId,
        return_url: `${ORIGIN}/payment/return`,
        auto_payment: true
      }
    );
  });

  it("captures POST tokenize-end refused for a token no gateway minted (AC-B9)", async () => {
    const sdkGateway = storeGateways.find(
      row => row.gateway?.use_frontend_implementation
    );

    if (!sdkGateway?.gateway_id) {
      dropCapture(generator, "token-unusable");
      throw new Error(
        "This brand offers no gateway that runs its own capture flow, so the " +
          "tokenise-end refusal cannot be captured."
      );
    }

    await generator.post(
      `/api/gateway/frontend/tokenize-end/${sdkGateway.gateway_id}?case=token-unusable`,
      {
        client_id: clientId,
        client_payment_details_id: FOREIGN_CLIENT,
        token: "not-a-token-any-gateway-minted",
        auto_payment: true
      }
    );
  });

  it("captures DELETE /api/clients/{id}/payment_details/{id} for a method that is gone (AC-B13)", async () => {
    await generator.delete(
      `/api/clients/${clientId}/payment_details/${FOREIGN_CLIENT}?case=already-gone`
    );
  });
});
