// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview useCriteriaUrlSync.utils — the criteria ⇄ url-param walker
 * (FE-3226 bf7adb8d5, 5f7ce3d8e)
 *
 * ## Job To Be Done
 * Prove the two things a reload depends on. First, that a BARE-LEAF filter
 * column — one the schema declares as a plain leaf with no operator map
 * (`reference`, `subject`, `contract_product_id`) — reaches the url and comes
 * back: `criteria → params → criteria` returns it unchanged, and it survives
 * beside a nested-operator column (`statusCode: {eq|neq}`) that already worked.
 * Second, that the top-level quick-search `query` string round-trips, and only
 * when the schema actually declares `query` — a schema without it emits no
 * `query` param.
 *
 * ## What Breaks If These Fail
 * A client sets a reference/subject/product filter or a quick-search term,
 * reloads the page, and the url the walker rebuilt has silently dropped it —
 * the filter or search is gone and the table reads the wrong rows. The
 * nested-operator column masked the hole: it round-tripped while every bare
 * leaf beside it fell out of the url.
 *
 * ## Provenance
 * These are pure serialisation functions with no external boundary; the schema
 * and model here are constructed function INPUTS, not recorded wire data. The
 * bare-vs-nested SPLIT is the shape the real `tickets` query schema exhibits
 * (`packages/headless/src/modules/tickets/tickets.schemas.ts`, pinned by
 * `tickets.schemas.test.ts`); the column names are representative of it rather
 * than a copy of it, and this file does not track that schema's membership.
 * Two of them are deliberately no longer in it: `statusCode` was superseded by
 * the `isClosed` tri-state, and `contract_product_id` was removed altogether
 * because the product a ticket is about is a RELATIONSHIP and now lives in the
 * scope context (`.for('product', id)`). Both are kept here as inputs — the
 * walker must serialise whatever shape it is handed, and dropping a column
 * would delete a bare-leaf case this proves rather than reflect one.
 */

import { describe, expect, it } from "vitest";
import {
  QUERY_PARAM,
  criteriaToParams,
  filterParam,
  paramsToCriteria
} from "../useCriteriaUrlSync.utils";

// -----------------------------------------------------------------------------

/**
 * The `tickets` query-collection shape: three BARE-LEAF columns (a plain type,
 * no operator `properties` map), one NESTED-operator column (`statusCode`), and
 * the top-level `query` string beside `filters`.
 */
function ticketsSchema(): Record<string, unknown> {
  return {
    properties: {
      filters: {
        properties: {
          reference: { type: "string" },
          subject: { type: "string" },
          contract_product_id: { type: "string" },
          statusCode: {
            properties: { eq: { type: "string" }, neq: { type: "string" } }
          }
        }
      },
      query: { type: "string", minLength: 3 }
    }
  };
}

/** The same collection with no quick-search branch declared. */
function schemaWithoutQuery(): Record<string, unknown> {
  const schema = ticketsSchema();
  delete (schema.properties as Record<string, unknown>).query;
  return schema;
}

// -----------------------------------------------------------------------------

describe("criteria url sync — a bare-leaf filter column round-trips (bf7adb8d5)", () => {
  const bareLeafColumns = ["reference", "subject", "contract_product_id"];

  it.each(bareLeafColumns)(
    "emits a url param for the bare-leaf '%s' column rather than dropping it",
    column => {
      const model = { filters: { [column]: "XGD-235-12434" } };

      const params = criteriaToParams(ticketsSchema(), model);

      expect(params[filterParam(column, "")]).toBe("XGD-235-12434");
    }
  );

  it.each(bareLeafColumns)(
    "carries the bare-leaf '%s' value back through criteria → params → criteria",
    column => {
      const model = { filters: { [column]: "XGD-235-12434" } };

      const roundTripped = paramsToCriteria(
        ticketsSchema(),
        criteriaToParams(ticketsSchema(), model)
      );

      expect(roundTripped).toEqual(model);
    }
  );

  it("keeps a bare-leaf column AND a nested-operator column across the round-trip", () => {
    const model = {
      filters: {
        reference: "XGD-235-12434",
        statusCode: { neq: "ticket_closed" }
      }
    };

    const roundTripped = paramsToCriteria(
      ticketsSchema(),
      criteriaToParams(ticketsSchema(), model)
    );

    expect(roundTripped).toEqual(model);
  });

  it("round-trips a nested-operator column on its own (the path that already worked, unregressed)", () => {
    const model = { filters: { statusCode: { eq: "ticket_open" } } };

    const roundTripped = paramsToCriteria(
      ticketsSchema(),
      criteriaToParams(ticketsSchema(), model)
    );

    expect(roundTripped).toEqual(model);
  });
});

describe("criteria url sync — the quick-search query string round-trips (5f7ce3d8e)", () => {
  it("emits the query param when the schema declares query", () => {
    const params = criteriaToParams(ticketsSchema(), {
      query: "recorded reply"
    });

    expect(params[QUERY_PARAM]).toBe("recorded reply");
  });

  it("carries the query term back through criteria → params → criteria", () => {
    const model = { query: "recorded reply" };

    const roundTripped = paramsToCriteria(
      ticketsSchema(),
      criteriaToParams(ticketsSchema(), model)
    );

    expect(roundTripped).toEqual(model);
  });

  it("emits NO query param when the schema does not declare query", () => {
    const params = criteriaToParams(schemaWithoutQuery(), {
      query: "recorded reply"
    });

    expect(params).not.toHaveProperty(QUERY_PARAM);
  });

  it("reads back NO query from params when the schema does not declare query", () => {
    const criteria = paramsToCriteria(schemaWithoutQuery(), {
      [QUERY_PARAM]: "recorded reply"
    });

    expect(criteria).not.toHaveProperty(QUERY_PARAM);
  });
});
