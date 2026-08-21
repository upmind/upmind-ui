// -----------------------------------------------------------------------------
/**
 * @fileoverview Query Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real endpoints the `query` module hits and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir —
 * the same files `query.int.test.ts` replays through MSW. Run on demand:
 *
 *   pnpm fixtures:generate query
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix (see the package vitest configs). It has
 * no assertions: an `it()` succeeds when the capture completes. `save()` in
 * `afterAll` writes every capture once.
 *
 * Ported from the legacy `auth.fixtures.ts` shape: one `describe`, one `it()`
 * per endpoint, and a single `save()`. The captured set is exactly the three
 * endpoints `query.int.test.ts` replays, so regeneration overwrites the
 * committed seeds in place — one file per endpoint, no duplicate identities.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

// Base is the API ROOT (not `/api`): the module's data endpoints live under
// `/api/*` while the OAuth token endpoint is served at the root `/oauth/*`, so
// each capture passes its full path.
const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set it " +
          "in .env.recording). The API resolves the brand from the Origin " +
          'header; without it every call returns 404 "Domain not found!".'
      );
    })();

describe("Query API Fixtures Generator", () => {
  let generator: Generator;

  beforeAll(() => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "query"
    });
  });

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/countries (200)", async () => {
    await generator.get("/api/countries");
  });

  it("captures GET /api/countries/zz (404)", async () => {
    await generator.get("/api/countries/zz");
  });

  it("captures GET /api/countries?limit=2 pages 1 and 2 (the pager's real walk)", async () => {
    // `limit`/`offset` are excluded from a fixture's identity, so two reads of
    // the same collection at different offsets would overwrite each other; the
    // `case=` marker is an identity param and keeps both real answers.
    const pageOne = await generator.get(
      "/api/countries?limit=2&offset=0&case=page-1"
    );
    const pageTwo = await generator.get(
      "/api/countries?limit=2&offset=2&case=page-2"
    );
    if (pageOne.status !== 200 || pageTwo.status !== 200) {
      throw new Error(
        `Paged capture returned ${pageOne.status}/${pageTwo.status} — refusing ` +
          "to ship a fixture that does not represent a real page."
      );
    }
  });

  it("captures POST /oauth/access_token with bad credentials (401)", async () => {
    await generator.post(
      "/oauth/access_token",
      {
        grant_type: GrantTypes.PASSWORD,
        username: "invalid@example.com",
        password: "wrongpassword"
      },
      { "Content-Type": "application/x-www-form-urlencoded" }
    );
  });
});
