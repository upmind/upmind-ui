// -----------------------------------------------------------------------------
/**
 * @fileoverview Product-Catalogue API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture the real `basket/products` responses this module's criteria migration
 * emits — the only `listInfinite` arm in the tree as well as its paged arm:
 *
 *   pnpm fixtures:generate product-catalogue
 *
 * ## Captures
 * `…-case-page-1` / `…-case-page-2` — a real `limit=2` walk under the declared
 * `order=order` default, which the infinite arm accumulates rather than
 * replaces. `…-case-name-like` — the migrated free-text key. `…-case-category`
 * — `filter[products_category_id|eq]` carrying a REAL category id list, the
 * capture E1 hangs on: the legacy wire sent an operator-less
 * `filter[products_category_id]`, and only a live answer settles whether the
 * operator form narrows the same way.
 *
 * Every capture carries the URL-level `with` expansion and the
 * `filter[provision_blueprint.category.code|neq]=domain-names` exclusion the
 * service pins, because those scope WHICH collection this is.
 *
 * ## Why this is not a normal test
 * REAL `fetch` calls against `VITE_API_URL` with staging credentials; the
 * `*.fixtures.ts` suffix keeps it out of the unit and integration projects.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes, ProvisionCategoryCodes } from "@upmind-automation/types";
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

const SCOPE = [
  `filter[provision_blueprint.category.code|neq]=${ProvisionCategoryCodes.DOMAIN_NAMES}`,
  "with=image,images,prices,products_attributes,products_options,products_options.prices,category.top_category.top_category.top_category.top_category"
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

describe("Product-Catalogue API Fixtures Generator", () => {
  let generator: Generator;
  let accessToken: string;
  let needle: string;
  let categoryId: string;

  beforeAll(async () => {
    accessToken = (await mintClientToken()).access_token;
    const headers = {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    };

    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "product-catalogue"
    });

    const products = await fetch(`${API_URL}/api/basket/products?limit=2`, {
      headers
    });
    const rows = ((await products.json()) as { data?: { name?: string }[] })
      ?.data;
    needle = rows?.[0]?.name?.slice(0, 3) ?? "";
    if (!needle) {
      throw new Error(
        "The brand publishes no named product — the filter capture has " +
          "nothing real to narrow on."
      );
    }

    const categories = await fetch(
      `${API_URL}/api/basket/products_categories?limit=2`,
      { headers }
    );
    const category = ((await categories.json()) as { data?: { id?: string }[] })
      ?.data?.[0]?.id;
    if (!category) {
      throw new Error(
        "The brand publishes no product category — the category filter " +
          "capture has no real id to send."
      );
    }
    categoryId = category;
  }, 30000);

  afterAll(() => generator.save());

  it("captures the basket bootstrap the catalogue's `enabled` gate waits on", async () => {
    // `loadList` is `enabled: () => !!currencyCode.value`, and the currency is
    // a child of the basket machine — so a catalogue integration spec cannot
    // reach `basket/products` until this chain replays. Captured here rather
    // than stubbed, so the boot the specs run through is the real one.
    generator.setBearerToken(accessToken);
    for (const path of [
      "/api/self?with=actor",
      "/api/billing_cycles",
      "/api/countries",
      "/api/currencies",
      "/api/orders/current",
      "/api/org/modules",
      "/api/brand/settings",
      "/api/config/brand/values",
      "/api/config/organisation/values"
    ]) {
      const { status } = await generator.get(path);
      if (status >= 400 && status !== 404) {
        throw new Error(`Bootstrap capture ${path} returned ${status}.`);
      }
    }
    generator.clearBearerToken();
  });

  it("captures the limit=2 walk under the declared order=order", async () => {
    generator.setBearerToken(accessToken);
    const pageOne = await generator.get(
      `/api/basket/products?${SCOPE}&order=order&limit=2&offset=0&case=page-1`
    );
    const pageTwo = await generator.get(
      `/api/basket/products?${SCOPE}&order=order&limit=2&offset=2&case=page-2`
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
          "than one page of products."
      );
    }
  });

  it("captures filter[name|like] — the migrated free-text key", async () => {
    generator.setBearerToken(accessToken);
    const { status, body } = await generator.get(
      `/api/basket/products?${SCOPE}&filter[name|like]=${encodeURIComponent(
        `%${needle}%`
      )}&order=order&limit=2&case=name-like`
    );
    generator.clearBearerToken();

    if (status !== 200) {
      throw new Error(
        `filter[name|like] returned ${status} — the API does not accept the ` +
          "criteria wire form for this collection (E1 evidence, not a test bug)."
      );
    }
    if (((body as { total?: number })?.total ?? 0) === 0) {
      throw new Error(
        `filter[name|like]=%${needle}% narrowed to zero rows; the needle came ` +
          "from a live row, so a zero result means the key was ignored."
      );
    }
  });

  it("captures filter[products_category_id|eq] — the operator form replacing the legacy bare key", async () => {
    generator.setBearerToken(accessToken);
    const operatorForm = await generator.get(
      `/api/basket/products?${SCOPE}&filter[products_category_id|eq]=${categoryId}&order=order&limit=2&case=category-eq`
    );
    const legacyForm = await generator.get(
      `/api/basket/products?${SCOPE}&filter[products_category_id]=${categoryId}&order=order&limit=2&case=category-bare`
    );
    generator.clearBearerToken();

    if (operatorForm.status !== 200) {
      throw new Error(
        `filter[products_category_id|eq] returned ${operatorForm.status} — the ` +
          "migrated key is rejected by the API (E1 evidence, not a test bug)."
      );
    }
    const narrowed = (operatorForm.body as { total?: number })?.total ?? 0;
    const legacy = (legacyForm.body as { total?: number })?.total ?? 0;
    if (narrowed === 0) {
      throw new Error(
        "filter[products_category_id|eq] narrowed to zero rows against a real " +
          "category id — the key was ignored rather than applied."
      );
    }
    if (legacyForm.status === 200 && legacy !== narrowed) {
      throw new Error(
        `The operator form narrowed to ${narrowed} and the legacy bare key to ` +
          `${legacy} — the migration changes which rows the catalogue returns.`
      );
    }
  });
});
