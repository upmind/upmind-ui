// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Custom-Pages API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `custom_pages` endpoints the `client-custom-pages` module
 * hits and (re)generate their sanitised v3 fixtures into this module's OWN
 * co-located `fixtures/` dir — the same files the `.int.test.ts` files replay
 * through MSW. Run on demand:
 *
 *   pnpm fixtures:generate client-custom-pages
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal `*.test.ts` / `*.int.test.ts` suites
 * by the `*.fixtures.ts` suffix. It has no assertions of module behaviour: an
 * `it()` succeeds when the capture completes. `save()` in `afterAll` writes
 * every capture once.
 *
 * ## Captures
 * `get-custom-pages` (AC-1/AC-9/O5/O6 — the bare, unparameterised list read,
 * token-free, one configured page) · `get-custom-pages-custom-page`
 * (AC-3/AC-4/AC-6/O7/O9-O11/O31 — the real 200 by-slug resolve on the exact
 * `api/custom_pages/{slug}` path) · `get-custom-pages-no-such-page-xyz`
 * (AC-5/O7/O18 — a real 404 for an unknown slug on the same path).
 *
 * ## Recording state — two pages now configured (2026-10-06)
 * The recording brand previously published ZERO custom pages. The operator has
 * since configured TWO: `custom-page` (`show_on_menu:true`, id
 * `3825d96e-763e-d091-3dc4-174825283406`) and `custom-page-invisible`
 * (`show_on_menu:false`, id `85d085e6-9d56-2371-9ea2-18e940d42370`) — bare list
 * `total:2`. With real rows recorded, the by-slug positive resolve (AC-3/O7's
 * 200 branch), the cache short-circuit (AC-4/O9-O11), the template-handoff id
 * (AC-6/O31) and the whole-list + menu-narrowing set (AC-2) are all proven
 * against recorded rows.
 *
 * O25 is now DETERMINED: the probe (`?filter[show_on_menu]=1`) returns `total:1`
 * — only `custom-page` — while the bare read carries both, so the wire HONOURS
 * the filter (parity.yaml O25 → Direct). STILL blocked: the translation-fallback
 * OVER A RECORDED ROW (AC-7/O26/O30) — both rows' `*_translated` members are
 * populated, so the empty-translation fallback has no recorded row and stays
 * proven by the pure-unit mapper spec. No fixture is fabricated for anything
 * not genuinely recorded.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";
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
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set " +
          "it in .env.recording). The API resolves the brand from the " +
          'Origin header; without it every call returns 404 "Domain not found!".'
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------

describe("client-custom-pages API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-custom-pages"
    });

    const token = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.client.username,
      password: API_CREDENTIALS.client.password
    });
    if (!token) {
      throw new Error(
        "Could not mint a client token with the staging credentials — " +
          "check tests/fixtures/credentials.ts against the recording brand. " +
          "The by-slug single read uses withAccessToken:true, so its 200 " +
          "capture needs a real client session; refusing to fake it."
      );
    }
    clientToken = token;
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/custom_pages (200 — the bare list, one configured page)", async () => {
    const response = await generator.get("/api/custom_pages");
    if (response.status !== 200) {
      throw new Error(
        `Expected 200 from the bare list read, got ${response.status} — ` +
          "refusing to ship a fixture that does not represent the real read."
      );
    }
  });

  it("captures GET /api/custom_pages/custom-page (200 — the real by-slug resolve, token-bearing per D2)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const response = await generator.get("/api/custom_pages/custom-page");
    generator.clearBearerToken();
    if (response.status !== 200) {
      throw new Error(
        `Expected 200 from the by-slug resolve, got ${response.status} — ` +
          "the configured page's slug is `custom-page` and the single read is " +
          "token-bearing (D2). A non-200 here means either the page is gone " +
          "or the credentials are wrong. Refusing to ship a fabricated 200."
      );
    }
  });

  it("captures GET /api/custom_pages?filter[show_on_menu]=1 (200 — the plain show_on_menu form; two-page brand, so it narrows to the shown page)", async () => {
    await generator.get(
      "/api/custom_pages?filter[show_on_menu]=1&case=menu-filter-probe"
    );
  });

  it("captures GET /api/custom_pages?filter[show_on_menu|eq]=1 (200 — the EXACT operator form the module emits; proves the real wire key narrows)", async () => {
    await generator.get(
      "/api/custom_pages?filter[show_on_menu|eq]=1&case=menu-filter-eq-probe"
    );
  });

  it("captures GET /api/custom_pages/no-such-page-xyz (404 — real typed absence)", async () => {
    const response = await generator.get("/api/custom_pages/no-such-page-xyz");
    if (response.status !== 404) {
      throw new Error(
        `Expected 404 for an unknown slug, got ${response.status} — ` +
          "refusing to ship an AC-5 fixture that is not a real absence."
      );
    }
  });
});
