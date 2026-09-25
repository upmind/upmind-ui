// -----------------------------------------------------------------------------
/**
 * @fileoverview useContractProducts query controls — the list-page
 * narrowings a client drives on `useContractProducts` (integration; AC-1,
 * FE-3029 list-page repair, `design ✅.md` §8.2)
 *
 * ## Job To Be Done
 * The legacy client product list gives a hand narrowings the criteria channel
 * alone cannot reach — each needs a DRIVEABLE control: a schema leaf
 * `useQuerySchema()` declares AND a matching `useQueryUischema()` control the
 * page's FilterBar draws. This suite drives the REAL collection against the
 * recorded list capture and proves, for each of quick search, product name,
 * category name, date purchased, next due date, price, subscriptions-only and
 * one-off-only, on the public surface
 * `useContractProducts().useContext().schemas.query`:
 *  - the SCHEMA LEAF (`schemas.query.schema`), compiled with the repo's own
 *    AJV and shown to accept a value the control produces and reject one it
 *    forbids — quick search floors the term at three characters; each toggle
 *    is a real two-value enum `[0, null]`, never a free number box;
 *  - the UISCHEMA CONTROL (`schemas.query.uischema`) — the FilterBar element,
 *    at the leaf's scope, carrying the copy key the page labels it with;
 *  - for the top-level quick search alone, the criteria CHANNEL: a term of
 *    three characters reaches the request and a two-character one never does.
 *
 * The value a DRIVEN control writes, read on the wire, is proven where the
 * control lives — client-vue's `contract-products-filter-wire.test.ts`. Each
 * filter column's criteria-channel key is proven once, by the AC-1 narrowing
 * Outline in `contract-product.reads.int.test.ts`, and is not re-proven here.
 *
 * ## Provenance
 * Every response body is the module's RECORDED `get-contracts-products-split-count-1`
 * capture, served through `recorded.list()`; no wire body is authored here. The
 * schema and uischema asserted are the module's OWN published output, read off
 * the live context, never a literal.
 *
 * ## What Breaks If These Fail
 * A narrowing the legacy list offers becomes unreachable on the page — the
 * schema drops the leaf, the FilterBar draws no control for it, or the value
 * never reaches the request — and a client silently loses a filter they have
 * today.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { unref } from "vue";
import { useContractProducts } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";
import { useValidation } from "../../../utils";
import type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

type Validator = ((data: unknown) => boolean) & {
  errors?: ErrorObject[] | null;
};

function compile(schema: unknown): Validator {
  const { ajv } = useValidation() as unknown as {
    ajv: { compile: (schema: object) => Validator };
  };
  return ajv.compile(schema as object);
}

type UiControl = {
  type?: string;
  scope?: string;
  i18n?: string;
  options?: Record<string, unknown>;
};

type QueryUiSchema = { type?: string; elements?: UiControl[] };

function controlAt(
  uischema: QueryUiSchema,
  scope: string
): UiControl | undefined {
  return (uischema.elements ?? []).find(element => element.scope === scope);
}

async function bootCollectionObservingUrls(): Promise<{
  collection: ReturnType<ReturnType<typeof useContractProducts>["as"]>;
  urls: string[];
}> {
  await seedClientSession();
  installBackgroundStubs();
  const urls: string[] = [];
  server?.use(
    http.get("*/contracts_products", ({ request }) => {
      urls.push(request.url);
      return HttpResponse.json(recorded.list(), { status: 200 });
    })
  );
  const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
  await collection.useActions().isReady();
  return { collection, urls };
}

function latestParams(urls: string[]): URLSearchParams {
  return new URL(urls[urls.length - 1]!).searchParams;
}

function querySchemaOf(
  collection: Awaited<
    ReturnType<typeof bootCollectionObservingUrls>
  >["collection"]
): Record<string, never> {
  return unref(collection.useContext().schemas.query.schema) as Record<
    string,
    never
  >;
}

function queryUischemaOf(
  collection: Awaited<
    ReturnType<typeof bootCollectionObservingUrls>
  >["collection"]
): QueryUiSchema {
  return unref(collection.useContext().schemas.query.uischema) as QueryUiSchema;
}

// -----------------------------------------------------------------------------

/**
 * `@proves contract-product.feature:1004` — a quick-search box narrows my
 * products by a search term.
 */
describe("useContractProducts quick search — a top-level query floored at three characters (AC-1)", () => {
  it("AC-1 declares the top-level query leaf: a three-character term validates, two characters is rejected", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const validate = compile(querySchemaOf(collection));

    expect(validate({ query: "abc" })).toBe(true);
    expect(validate({ query: "ab" })).toBe(false);
  });

  it("AC-1 lays out a quick-search control at the top-level query scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/query"
    );

    expect(control?.i18n).toBe("form.contract_product_search");
    expect(control?.options?.format).toBe("search");
  });

  it("AC-1 the quick-search term reaches the wire as a top-level query param", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection.useActions().setCriteria({ query: "hosting" });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("query")).toBe("hosting");
    });
  });

  it("AC-1 a quick search and a filter narrow together: both reach the one outbound request", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection.useActions().setCriteria({
      query: "hosting",
      filters: { "product.category.name": { like: "Web" } }
    });

    await vi.waitFor(() => {
      const params = latestParams(urls);
      expect(params.get("query")).toBe("hosting");
      expect(params.get("filter[product.category.name|like]")).toBe("%Web%");
    });
  });
});

/**
 * `@proves contract-product.feature:1010` — a quick-search term shorter than
 * three characters is never sent.
 */
describe("useContractProducts quick search — a term under three characters never reaches the request (AC-1)", () => {
  it("AC-1 a two-character term is never sent, and the next valid term still is", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection.useActions().setCriteria({ query: "ho" });
    collection.useActions().setCriteria({ query: "hosting" });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("query")).toBe("hosting");
    });
    const sentTerms = urls.map(url => new URL(url).searchParams.get("query"));
    expect(sentTerms).not.toContain("ho");
  });
});

/**
 * `@proves contract-product.feature:1016` — a product-name box narrows my
 * products by their product name.
 */
describe("useContractProducts product-name filter — narrow by the product name (AC-1)", () => {
  it("AC-1 lays out a product-name search control at the product-name leaf scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/filters/properties/product.name/properties/like"
    );

    expect(control?.i18n).toBe("form.contract_product_name_search");
    expect(control?.options?.format).toBe("search");
  });

  it("AC-1 the product-name leaf takes part of a name and rejects a value that is not text", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const validate = compile(querySchemaOf(collection));

    expect(validate({ filters: { "product.name": { like: "Host" } } })).toBe(
      true
    );
    expect(validate({ filters: { "product.name": { like: 42 } } })).toBe(false);
  });
});

/**
 * `@proves contract-product.feature:1022` — a category-name box narrows my
 * products by their category name.
 */
describe("useContractProducts category-name filter — narrow by the category name (AC-1)", () => {
  it("AC-1 lays out a category-name search control at the category-name leaf scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/filters/properties/product.category.name/properties/like"
    );

    expect(control?.i18n).toBe("form.contract_product_category_name");
    expect(control?.options?.format).toBe("search");
  });

  it("AC-1 the category-name leaf takes part of a name and rejects a value that is not text", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const validate = compile(querySchemaOf(collection));

    expect(
      validate({ filters: { "product.category.name": { like: "Host" } } })
    ).toBe(true);
    expect(
      validate({ filters: { "product.category.name": { like: 42 } } })
    ).toBe(false);
  });
});

/**
 * `@proves contract-product.feature:1028` — a date control narrows my products
 * to those bought after a date.
 */
describe("useContractProducts date-purchased filter — narrow by purchase date (AC-1)", () => {
  it("AC-1 lays out a date-purchased control at the created_at.gt leaf scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/filters/properties/created_at/properties/gt"
    );

    expect(control?.i18n).toBe("form.contract_product_date_purchased");
  });

  it("AC-1 the date-purchased leaf takes a picked date and rejects text that is not a date", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const validate = compile(querySchemaOf(collection));

    expect(validate({ filters: { created_at: { gt: "2024-01-01" } } })).toBe(
      true
    );
    expect(validate({ filters: { created_at: { gt: "last spring" } } })).toBe(
      false
    );
  });
});

/**
 * `@proves contract-product.feature:1034` — a date control narrows my products
 * to those next due after a date.
 */
describe("useContractProducts next-due-date filter — narrow by next due date (AC-1)", () => {
  it("AC-1 lays out a next-due-date control at the next_due_date.gt leaf scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/filters/properties/next_due_date/properties/gt"
    );

    expect(control?.i18n).toBe("form.contract_product_next_due_date");
  });

  it("AC-1 the next-due-date leaf takes a picked date and rejects text that is not a date", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const validate = compile(querySchemaOf(collection));

    expect(validate({ filters: { next_due_date: { gt: "2024-01-01" } } })).toBe(
      true
    );
    expect(validate({ filters: { next_due_date: { gt: "next month" } } })).toBe(
      false
    );
  });
});

/**
 * `@proves contract-product.feature:1040` — a price control narrows my products
 * by price.
 */
describe("useContractProducts price filter — narrow by price (AC-1)", () => {
  it("AC-1 lays out a price control at the total_amount leaf scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/filters/properties/total_amount"
    );

    expect(control?.i18n).toBe("form.contract_product_price");
  });

  it("AC-1 the price leaf takes an amount and rejects text that is not a number", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const validate = compile(querySchemaOf(collection));

    expect(validate({ filters: { total_amount: 100 } })).toBe(true);
    expect(validate({ filters: { total_amount: "cheap" } })).toBe(false);
  });
});

const TOGGLES = [
  {
    toggle: "subscriptions-only",
    operator: "neq",
    i18n: "form.contract_product_subscriptions_only"
  },
  {
    toggle: "one-off-only",
    operator: "eq",
    i18n: "form.contract_product_one_time_only"
  }
] as const;

type Toggle = (typeof TOGGLES)[number];

function billingCycleLeaf(operator: Toggle["operator"], value: unknown) {
  return { filters: { billing_cycle_days: { [operator]: value } } };
}

/**
 * `@proves contract-product.feature:1049` — a subscriptions-only toggle.
 * `@proves contract-product.feature:1060` — a one-off-only toggle.
 */
describe.each(TOGGLES)(
  "useContractProducts $toggle toggle — its own two-position control (AC-1)",
  ({ operator, i18n }) => {
    it(`AC-1 lays out a button-group control at the billing_cycle_days.${operator} leaf scope`, async () => {
      const { collection } = await bootCollectionObservingUrls();
      const control = controlAt(
        queryUischemaOf(collection),
        `#/properties/filters/properties/billing_cycle_days/properties/${operator}`
      );

      expect(control?.i18n).toBe(i18n);
      expect(control?.options?.format).toBe("button-group");
    });

    it(`AC-1 the billing_cycle_days.${operator} leaf offers exactly two positions, on (0) and all (null), never a free number box`, async () => {
      const { collection } = await bootCollectionObservingUrls();
      const leaf = (
        querySchemaOf(collection) as unknown as {
          properties: {
            filters: {
              properties: {
                billing_cycle_days: {
                  properties: Record<string, { enum?: unknown[] }>;
                };
              };
            };
          };
        }
      ).properties.filters.properties.billing_cycle_days.properties[operator];
      const validate = compile(querySchemaOf(collection));

      expect(leaf?.enum).toEqual([0, null]);
      expect(validate(billingCycleLeaf(operator, 5))).toBe(false);
    });
  }
);

/**
 * The `on` rows of both toggle Outlines:
 * - `@proves contract-product.feature:1056` — subscriptions-only on
 * - `@proves contract-product.feature:1067` — one-off-only on
 *
 * The `all` rows:
 * - `@proves contract-product.feature:1057` — subscriptions-only all
 * - `@proves contract-product.feature:1068` — one-off-only all
 *
 * The leaf is graded here; the driven write of each position, read on the
 * wire, is client-vue's `contract-products-filter-wire.test.ts`.
 */
describe.each(TOGGLES)(
  "useContractProducts $toggle toggle — each position is a value the leaf accepts (AC-1)",
  ({ operator }) => {
    it(`AC-1 the on position (0) validates on billing_cycle_days.${operator}`, async () => {
      const { collection } = await bootCollectionObservingUrls();
      const validate = compile(querySchemaOf(collection));

      expect(validate(billingCycleLeaf(operator, 0))).toBe(true);
    });

    it(`AC-1 the all position (null) validates on billing_cycle_days.${operator}`, async () => {
      const { collection } = await bootCollectionObservingUrls();
      const validate = compile(querySchemaOf(collection));

      expect(validate(billingCycleLeaf(operator, null))).toBe(true);
    });
  }
);
