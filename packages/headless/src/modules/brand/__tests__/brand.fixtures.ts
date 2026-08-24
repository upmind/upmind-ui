/**
 * @fileoverview Brand API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the real brand-related endpoints the brand module hits and
 * generate sanitised v3 fixtures for integration tests. Run on demand:
 *
 *   pnpm fixtures:generate brand
 *
 * ## Captures (brand.feature AC-1,2,3,4)
 * - GET /api/brand/settings (AC-1)
 * - GET /api/config/brand/values with filter[keys|eq] (AC-2)
 * - GET /api/config/organisation/values (AC-3)
 * - GET /api/org/modules (AC-4)
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { BrandConfigKeys, GrantTypes } from "@upmind-automation/types";
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

const BRAND_CONFIG_KEYS = [
  BrandConfigKeys.BASKET_DEFAULT_CURRENCY,
  BrandConfigKeys.PRICE_DISPLAY_TYPE,
  BrandConfigKeys.DEFAULT_PAYMENT_PERIOD
].join(",");

async function mintToken(
  grant: Record<string, string>
): Promise<IToken | undefined> {
  const response = await fetch(`${API_URL}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: ORIGIN
    },
    body: new URLSearchParams(grant).toString()
  });
  const body = await response.json().catch(() => null);
  const token = (body?.access_token ? body : body?.data) as IToken | undefined;
  return token?.access_token ? token : undefined;
}

describe("brand fixtures generator", () => {
  let generator: Generator;
  let clientToken: IToken | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "brand"
    });
    clientToken = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      ...API_CREDENTIALS.client
    });
    if (!clientToken) throw new Error("Failed to mint client token");
  });

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/brand/settings (AC-1)", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get("/api/brand/settings");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`brand/settings returned ${status}`);
    }
  });

  it("captures GET /api/config/brand/values (AC-2)", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get(
      `/api/config/brand/values?filter[keys|eq]=${encodeURIComponent(BRAND_CONFIG_KEYS)}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`config/brand/values returned ${status}`);
    }
  });

  it("captures GET /api/config/organisation/values (AC-3)", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get("/api/config/organisation/values");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`config/organisation/values returned ${status}`);
    }
  });

  it("captures GET /api/org/modules (AC-4)", async () => {
    generator.setBearerToken(clientToken!.access_token);
    const { status } = await generator.get("/api/org/modules");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`org/modules returned ${status}`);
    }
  });
});
