// -----------------------------------------------------------------------------
/**
 * @fileoverview Product-Categories API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the real `basket/products_categories` responses this module's
 * criteria migration emits:
 *
 *   pnpm fixtures:generate product-categories
 *
 * ## Captures
 * `…-case-unpaged` — the collection as the schema's `pagination.limit` default
 * of `0` asks for it, the boot read the whole tree walk depends on.
 * `…-case-page-1` / `…-case-page-2` — a real `limit=2` walk, so the pager has a
 * genuine second page to write through to.
 *
 * The subcategory `with` expansion and the `with_count` the service pins are
 * carried on every capture: the mapper reads both, so a body captured without
 * them would not be the body the composable receives.
 *
 * ## Why this is not a normal test
 * REAL `fetch` calls against `VITE_API_URL` with staging credentials; the
 * `*.fixtures.ts` suffix keeps it out of the unit and integration projects.
 */

import { join } from "node:path";
import { describe, it, afterAll, beforeAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures; the API " +
          'resolves the brand from Origin and answers 404 "Domain not found!" ' +
          "without it."
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

const SUBCATEGORIES = "subcategories";
const nested = (leaf: string): string =>
  [1, 2, 3, 4].map(depth => `${`${SUBCATEGORIES}.`.repeat(depth)}${leaf}`);

const SCOPE = [
  `with=${nested("image").join(",")}`,
  `with_count=products,${nested("products").join(",")}`
].join("&");

// -----------------------------------------------------------------------------

async function mintClientToken(): Promise<IToken> {
  const response = await fetch(`${API_URL}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: ORIGIN
    },
    body: new URLSearchParams({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.client.username,
      password: API_CREDENTIALS.client.password
    }).toString()
  });
  const body = await response.json().catch(() => null);
  const token = (body?.access_token ? body : body?.data) as IToken | undefined;
  if (!token?.access_token) {
    throw new Error(
      "Could not mint a client token with the staging credentials — check " +
        "tests/fixtures/credentials.ts against the recording brand."
    );
  }
  return token;
}

// -----------------------------------------------------------------------------

describe("Product-Categories API Fixtures Generator", () => {
  let generator: Generator;
  let accessToken: string;

  beforeAll(async () => {
    accessToken = (await mintClientToken()).access_token;
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "product-categories"
    });
  }, 30000);

  afterAll(() => generator.save());

  it("captures the brand bootstrap a replayed boot would otherwise leave unmatched", async () => {
    // The tree's own read sits behind the basket/brand boot, so a
    // module-scoped replay dir has to hold those answers too — captured, not
    // stubbed, so the boot the specs run through is the real one.
    generator.setBearerToken(accessToken);
    for (const path of [
      "/api/self?with=actor",
      "/api/org/modules",
      "/api/brand/settings",
      "/api/config/brand/values",
      "/api/config/organisation/values",
      "/api/currencies",
      "/api/orders/current"
    ]) {
      const { status } = await generator.get(path);
      if (status >= 400 && status !== 404) {
        throw new Error(`Bootstrap capture ${path} returned ${status}.`);
      }
    }
    generator.clearBearerToken();
  });

  it("captures the unpaged read the schema's limit=0 default asks for", async () => {
    generator.setBearerToken(accessToken);
    const { status, body } = await generator.get(
      `/api/basket/products_categories?${SCOPE}&limit=0&case=unpaged`
    );
    generator.clearBearerToken();

    if (status !== 200) {
      throw new Error(
        `Unpaged capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
    if (((body as { data?: unknown[] })?.data ?? []).length === 0) {
      throw new Error(
        "The brand publishes no product categories — there is no tree for the " +
          "specs to walk."
      );
    }
  });

  it("captures the limit=2 walk (pages 1 and 2)", async () => {
    generator.setBearerToken(accessToken);
    const pageOne = await generator.get(
      `/api/basket/products_categories?${SCOPE}&limit=2&offset=0&case=page-1`
    );
    const pageTwo = await generator.get(
      `/api/basket/products_categories?${SCOPE}&limit=2&offset=2&case=page-2`
    );
    generator.clearBearerToken();

    if (pageOne.status !== 200 || pageTwo.status !== 200) {
      throw new Error(
        `Paged capture returned ${pageOne.status}/${pageTwo.status} — refusing ` +
          "to ship a fixture that does not represent a real page."
      );
    }
    const total = (pageTwo.body as { total?: number })?.total ?? 0;
    if (total <= 2) {
      throw new Error(
        `The paged capture reports total ${total}; a limit=2 walk needs more ` +
          "than one page of categories."
      );
    }
  });
});
