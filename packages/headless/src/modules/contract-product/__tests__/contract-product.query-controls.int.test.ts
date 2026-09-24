// -----------------------------------------------------------------------------
/**
 * @fileoverview useContractProducts query controls — the six list-page
 * narrowings a client drives on `useContractProducts` (integration; AC-1,
 * FE-3029 list-page repair, `design ✅.md` §8.2)
 *
 * ## Job To Be Done
 * The legacy client product list gives a hand six narrowings the criteria
 * channel alone cannot reach — each needs a DRIVEABLE control: a schema leaf
 * `useQuerySchema()` declares AND a matching `useQueryUischema()` control the
 * page's FilterBar draws. This suite drives the REAL collection against the
 * recorded list capture and proves, for each of quick search, category name,
 * date purchased, next due date, price and subscriptions/one-off, all three
 * facets on the public surface `useContractProducts().useContext().schemas.query`:
 *  - the SCHEMA LEAF (`schemas.query.schema`), compiled with the repo's own
 *    AJV and shown to accept a value the control produces and reject one it
 *    forbids — quick search floors the term at three characters; the
 *    subscriptions/one-off toggle is a real two-value enum `[0, null]`, never a
 *    free number box;
 *  - the UISCHEMA CONTROL (`schemas.query.uischema`) — the FilterBar element,
 *    at the leaf's scope, carrying the copy key the page labels it with;
 *  - the VALUE reaching the wire through the criteria channel — `setCriteria`
 *    lands the narrowing on the outbound `contracts_products` request.
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
});

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

  it("AC-1 the category-name narrowing reaches the wire as filter[product.category.name|like]", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection.useActions().setCriteria({
      filters: { "product.category.name": { like: "Hosting" } }
    });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("filter[product.category.name|like]")).toBe(
        "%Hosting%"
      );
    });
  });
});

describe("useContractProducts date-purchased filter — narrow by purchase date (AC-1)", () => {
  it("AC-1 lays out a date-purchased control at the created_at.gt leaf scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/filters/properties/created_at/properties/gt"
    );

    expect(control?.i18n).toBe("form.contract_product_date_purchased");
  });

  it("AC-1 the date-purchased narrowing reaches the wire as filter[created_at|gt]", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection
      .useActions()
      .setCriteria({ filters: { created_at: { gt: "2024-01-01" } } });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("filter[created_at|gt]")).toBe(
        "2024-01-01"
      );
    });
  });
});

describe("useContractProducts next-due-date filter — narrow by next due date (AC-1)", () => {
  it("AC-1 lays out a next-due-date control at the next_due_date.gt leaf scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/filters/properties/next_due_date/properties/gt"
    );

    expect(control?.i18n).toBe("form.contract_product_next_due_date");
  });

  it("AC-1 the next-due-date narrowing reaches the wire as filter[next_due_date|gt]", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection
      .useActions()
      .setCriteria({ filters: { next_due_date: { gt: "2024-01-01" } } });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("filter[next_due_date|gt]")).toBe(
        "2024-01-01"
      );
    });
  });
});

describe("useContractProducts price filter — narrow by price (AC-1)", () => {
  it("AC-1 lays out a price control at the total_amount leaf scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/filters/properties/total_amount"
    );

    expect(control?.i18n).toBe("form.contract_product_price");
  });

  it("AC-1 the price narrowing reaches the wire as filter[total_amount]", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection.useActions().setCriteria({ filters: { total_amount: 100 } });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("filter[total_amount]")).toBe("100");
    });
  });
});

describe("useContractProducts subscriptions/one-off toggle — a real two-value choice (AC-1)", () => {
  it("AC-1 lays out a subscriptions-only button-group control at the billing_cycle_days.neq leaf scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/filters/properties/billing_cycle_days/properties/neq"
    );

    expect(control?.i18n).toBe("form.contract_product_subscriptions_only");
    expect(control?.options?.format).toBe("button-group");
  });

  it("AC-1 the subscriptions-only narrowing reaches the wire as filter[billing_cycle_days|neq]=0", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection
      .useActions()
      .setCriteria({ filters: { billing_cycle_days: { neq: 0 } } });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("filter[billing_cycle_days|neq]")).toBe(
        "0"
      );
    });
  });

  it("AC-1 the one-off toggle is a real two-value enum, not a free number box: 0 validates, an arbitrary count is rejected", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const schema = querySchemaOf(collection) as unknown as {
      properties: {
        filters: {
          properties: {
            billing_cycle_days: {
              properties: { eq: { enum?: unknown[] } };
            };
          };
        };
      };
    };
    const eq =
      schema.properties.filters.properties.billing_cycle_days.properties.eq;
    const validate = compile(querySchemaOf(collection));

    expect(eq.enum).toEqual([0, null]);
    expect(validate({ filters: { billing_cycle_days: { eq: 0 } } })).toBe(true);
    expect(validate({ filters: { billing_cycle_days: { eq: 5 } } })).toBe(
      false
    );
  });

  it("AC-1 lays out a one-off button-group control at the billing_cycle_days.eq leaf scope", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const control = controlAt(
      queryUischemaOf(collection),
      "#/properties/filters/properties/billing_cycle_days/properties/eq"
    );

    expect(control?.i18n).toBe("form.contract_product_one_time_only");
    expect(control?.options?.format).toBe("button-group");
  });

  it("AC-1 the one-off narrowing reaches the wire as filter[billing_cycle_days|eq]=0", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection
      .useActions()
      .setCriteria({ filters: { billing_cycle_days: { eq: 0 } } });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("filter[billing_cycle_days|eq]")).toBe("0");
    });
  });
});

describe("useContractProducts control leaves — each control accepts only the value it produces (AC-1)", () => {
  it("AC-1 the subscriptions-only toggle is a real two-value choice, not a free number box: 0 validates, an arbitrary count is rejected", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const validate = compile(querySchemaOf(collection));

    expect(validate({ filters: { billing_cycle_days: { neq: 0 } } })).toBe(
      true
    );
    expect(validate({ filters: { billing_cycle_days: { neq: 5 } } })).toBe(
      false
    );
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

  it("AC-1 the price leaf takes an amount and rejects text that is not a number", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const validate = compile(querySchemaOf(collection));

    expect(validate({ filters: { total_amount: 100 } })).toBe(true);
    expect(validate({ filters: { total_amount: "cheap" } })).toBe(false);
  });

  it("AC-1 the category-name leaf takes part of a name", async () => {
    const { collection } = await bootCollectionObservingUrls();
    const validate = compile(querySchemaOf(collection));

    expect(
      validate({ filters: { "product.category.name": { like: "Host" } } })
    ).toBe(true);
    expect(
      validate({ filters: { "product.category.name": { like: 42 } } })
    ).toBe(false);
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
