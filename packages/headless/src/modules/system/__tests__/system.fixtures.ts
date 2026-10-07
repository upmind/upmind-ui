/**
 * @fileoverview System API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the reference-data reads the system module makes and generate
 * sanitised v3 fixtures for integration tests. Run on demand:
 *
 *   pnpm fixtures:generate system
 *
 * ## Captures
 * - GET /api/billing_cycles?limit=0 (`ensureBillingCycles`)
 * - GET /api/countries?limit=0 (`ensureCountries`)
 *
 * ## The boot reads other tests replay (FE-3145, ADR 035)
 * Every signed-in test boots the basket, and the basket's load awaits both
 * reads (`basket.services.ts`). Recorded here, by the module that owns them,
 * so no test answers them with a body of its own.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
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

describe("system fixtures generator", () => {
  let generator: Generator;
  let clientToken: IToken | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "system"
    });
    clientToken = await mintClientToken();
  });

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/billing_cycles?limit=0", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get("/api/billing_cycles?limit=0");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`billing_cycles returned ${status}`);
    }
  });

  it("captures GET /api/countries?limit=0", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get("/api/countries?limit=0");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`countries returned ${status}`);
    }
  });
});
