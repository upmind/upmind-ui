/**
 * @fileoverview Basket API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the reads and writes the basket makes when a client signs in, and
 * generate sanitised v3 fixtures for integration tests. Run on demand:
 *
 *   pnpm fixtures:generate basket
 *
 * ## Captures
 * - PATCH /api/orders/claim — `claimBasket`: the client claims the guest's
 *   basket, sending the guest's token (`basket.services.ts`).
 * - GET /api/orders/current — the client's current basket.
 * - GET /api/basket_fields — the fields the loaded basket asks for.
 *
 * ## The boot reads other tests replay (FE-3145, ADR 035)
 * Every test that signs a client in holds a guest session too, so the basket
 * claims it. Recorded here, by the module that owns the call, so no test
 * answers it with a body of its own.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintGuestToken
} from "../../auth/__tests__/auth.tokens";
import type { IToken } from "@upmind-automation/types";

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
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set " +
          "it in .env.recording). The API resolves the brand from the " +
          'Origin header; without it every call returns 404 "Domain not found!".'
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

describe("basket fixtures generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let guestToken: IToken | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "basket"
    });
    clientToken = await mintClientToken();
    guestToken = await mintGuestToken();
  });

  afterAll(() => {
    generator.save();
  });

  it("captures PATCH /api/orders/claim — the client claims the guest's basket", async () => {
    if (!guestToken) throw new Error("Could not mint a guest token to claim.");

    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.patch("/api/orders/claim", {
      guest_token: guestToken.access_token
    });
    generator.clearBearerToken();
    if (status >= 500) {
      throw new Error(`orders/claim returned ${status}`);
    }
  });

  it("captures GET /api/orders/current — the client's current basket", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/orders/current");
    generator.clearBearerToken();
    if (status >= 500) {
      throw new Error(`orders/current returned ${status}`);
    }
  });

  it("captures GET /api/basket_fields — the fields the loaded basket asks for", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/basket_fields");
    generator.clearBearerToken();
    if (status >= 500) {
      throw new Error(`basket_fields returned ${status}`);
    }
  });
});
