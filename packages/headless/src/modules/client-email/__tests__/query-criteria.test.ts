// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email query criteria — the model, with NO HTTP (Task 41/44)
 *
 * ## Job To Be Done
 * `useQueryCriteria` is the collection's whole request state — intent → parse →
 * validate → translate — as ONE composable that knows nothing about fetching.
 * That split is the capability, so this file proves it the way the split makes
 * possible: no msw, no session, no wire. Every assertion runs against the REAL
 * shipped `useQuerySchema()`, never a schema written for the test.
 *
 * The four laws proven here:
 * 1. **The merge law.** `set` merges at BRANCH level — a filter never clears a
 *    live sort, and a sort never clears a live filter — while replacing the
 *    whole branch it names (which is what "apply this filter set" means).
 * 2. **The schema is the floor.** An emptied `sort` refills from the branch's
 *    own `default` (compact-before-parse, FB5e); an undeclared column never
 *    enters the model at all.
 * 3. **FB5c — a validation failure is SURFACED, never swallowed.** `error`
 *    carries ajv's verdict, and the rejected candidate is discarded so the last
 *    VALID criteria stands: refused loudly, not retained. What that costs the
 *    wire is proven at `criteria-rejected.int.test.ts`.
 * 4. **An untrusted seed is discarded WHOLE.** `criteria.model` rehydrates a
 *    cold boot from a url, and a url is user-editable: a candidate that fails
 *    validation falls back to schema defaults in its entirety rather than
 *    landing half-honoured.
 *
 * ## NOT proven here, and why (Task 41 finding, binding)
 * `set({ filters: { email: { like: "" } } })` cannot raise the ajv `minLength`
 * the spine and design §11.7 predicted: `compactDeep(…, { preserveContainers:
 * false })` strips the empty string BEFORE the parse — the very ordering those
 * documents make load-bearing for the `sort: []` → `default` refill. The two
 * demands are mutually exclusive and the shipped behaviour is the correct one
 * (an emptied search box means "no filter"). FB5c is proven above through
 * `pagination.limit`, which reaches ajv intact.
 *
 * ## What Breaks If These Fail
 * A `set` that replaces instead of merging lets a header filter silently clear
 * a drawer filter and a rehydrated url clear a live sort. A swallowed ajv
 * verdict shows the user a filter they never asked for with nothing to say why.
 * A partially-honoured stale url is a list that lies about what it is showing.
 */

import { describe, expect, it } from "vitest";
import { useQueryCriteria } from "../../query";
import { useQuerySchema } from "../client-email.schemas";
import { DEFAULT_SORT } from "../client-email.types";
import type { QueryCriteria } from "../../query";
import type { QueryModel } from "../client-email.types";

// -----------------------------------------------------------------------------

/** The i18n key the criteria's ajv failure carries — never English prose. */
const VALIDATION_ERROR_KEY = "error.query_validation_failed";

/** The limit `useQuerySchema()` declares as its `pagination.limit` default. */
const DECLARED_LIMIT = 10;

function bootCriteria(model?: Partial<QueryModel>): QueryCriteria<QueryModel> {
  return useQueryCriteria<QueryModel>({ schema: useQuerySchema(), model });
}

/** The ajv verdict as `error` publishes it, flattened for assertion. */
function ajvVerdict(criteria: QueryCriteria<QueryModel>): {
  status?: number;
  message?: string;
  keywords: string[];
  paths: string[];
} {
  const error = criteria.error.value as unknown as
    | {
        status?: number;
        message?: string;
        data?: { keyword: string; instancePath: string }[];
      }
    | undefined;
  return {
    status: error?.status,
    message: error?.message,
    keywords: (error?.data ?? []).map(entry => entry.keyword),
    paths: (error?.data ?? []).map(entry => entry.instancePath)
  };
}

// -----------------------------------------------------------------------------

describe("client-email query criteria — the declared floor (Task 41)", () => {
  it("boots on the schema's own defaults, unfiltered and with no error", () => {
    const criteria = bootCriteria();

    expect(criteria.model.value.sort).toEqual(DEFAULT_SORT);
    expect(criteria.model.value.pagination).toEqual({ limit: DECLARED_LIMIT });
    expect(criteria.model.value.filters).toBeUndefined();
    expect(criteria.isFiltered.value).toBe(false);
    expect(criteria.error.value).toBeUndefined();
  });

  it("re-publishes the declaration it was handed, so a consumer can read what is filterable at all", () => {
    const criteria = bootCriteria();

    expect(criteria.schema).toEqual(useQuerySchema());
  });

  it("an emptied sort refills from the branch's own default (FB5e)", () => {
    const criteria = bootCriteria();
    criteria.set({ sort: [{ field: "email", dir: "asc" }] });
    expect(criteria.model.value.sort).toEqual([{ field: "email", dir: "asc" }]);

    criteria.set({ sort: [] });

    expect(criteria.model.value.sort).toEqual(DEFAULT_SORT);
    expect(criteria.error.value).toBeUndefined();
  });

  it("an undeclared column never enters the model, and nothing surfaces", () => {
    const criteria = bootCriteria();

    criteria.set({ filters: { title: { like: "x" } } } as never);

    expect(criteria.model.value.filters).toBeUndefined();
    expect(criteria.isFiltered.value).toBe(false);
    expect(criteria.error.value).toBeUndefined();
  });
});

describe("client-email query criteria — model to wire (Task 41)", () => {
  it("a boolean filter lands on the model as false and on the wire as filter[verified|eq]=0", () => {
    const criteria = bootCriteria();

    criteria.set({ filters: { verified: { eq: false } } });

    expect(criteria.model.value.filters?.verified?.eq).toBe(false);
    expect(criteria.props.value.filters?.["filter[verified|eq]"]).toBe("0");
    expect(criteria.isFiltered.value).toBe(true);
  });

  it("the true half of the same column is 1, not the string 'true'", () => {
    const criteria = bootCriteria();

    criteria.set({ filters: { bounced: { eq: true } } });

    expect(criteria.props.value.filters?.["filter[bounced|eq]"]).toBe("1");
  });

  it("a like filter carries the translator's % wildcards; an unset column carries no value", () => {
    const criteria = bootCriteria();

    criteria.set({ filters: { email: { like: "mock-email-3" } } });

    expect(criteria.props.value.filters?.["filter[email|like]"]).toBe(
      "%mock-email-3%"
    );
    expect(criteria.props.value.filters?.["filter[verified|eq]"]).toBe("");
    expect(criteria.props.value.filters?.["filter[bounced|eq]"]).toBe("");
  });

  it("the sort model translates to the wire's [direction, property] tuple", () => {
    const criteria = bootCriteria();

    expect(criteria.props.value.sort).toEqual(["-", "created_at"]);

    criteria.set({ sort: [{ field: "email", dir: "asc" }] });

    expect(criteria.props.value.sort).toEqual(["", "email"]);
  });

  it("each criteria translates into its OWN wire object — one instance's filters never land in another's", () => {
    const first = bootCriteria();
    const second = bootCriteria();
    const firstWire = first.props.value.filters;

    second.set({ filters: { bounced: { eq: true } } });

    expect(firstWire?.["filter[bounced|eq]"]).toBe("");
    expect(first.props.value.filters).not.toBe(second.props.value.filters);
  });

  it("pagination reaches the wire triple as the model declares it", () => {
    const criteria = bootCriteria();

    criteria.set({ pagination: { limit: 2, offset: 4 } });

    expect(criteria.props.value.pagination).toEqual({ limit: 2, offset: 4 });
  });
});

describe("client-email query criteria — the merge law (Task 41, W-D33)", () => {
  it("a filter set after a sort leaves the sort intact", () => {
    const criteria = bootCriteria();
    criteria.set({ sort: [{ field: "email", dir: "asc" }] });

    criteria.set({ filters: { verified: { eq: false } } });

    expect(criteria.model.value.sort).toEqual([{ field: "email", dir: "asc" }]);
    expect(criteria.model.value.filters).toEqual({ verified: { eq: false } });
  });

  it("a sort set after a filter leaves the filter intact", () => {
    const criteria = bootCriteria();
    criteria.set({ filters: { verified: { eq: false } } });

    criteria.set({ sort: [{ field: "email", dir: "desc" }] });

    expect(criteria.model.value.filters).toEqual({ verified: { eq: false } });
    expect(criteria.model.value.sort).toEqual([
      { field: "email", dir: "desc" }
    ]);
  });

  it("a pagination change touches neither the live filter nor the live sort", () => {
    const criteria = bootCriteria();
    criteria.set({ filters: { bounced: { eq: true } } });
    criteria.set({ sort: [{ field: "email", dir: "asc" }] });

    criteria.set({ pagination: { limit: 2 } });

    expect(criteria.model.value.filters).toEqual({ bounced: { eq: true } });
    expect(criteria.model.value.sort).toEqual([{ field: "email", dir: "asc" }]);
    expect(criteria.model.value.pagination).toEqual({ limit: 2 });
  });

  it("merge depth is BRANCH level — a second filter set replaces the whole filters branch", () => {
    const criteria = bootCriteria();
    criteria.set({ filters: { verified: { eq: false } } });

    criteria.set({ filters: { bounced: { eq: true } } });

    expect(criteria.model.value.filters).toEqual({ bounced: { eq: true } });
    expect(criteria.props.value.filters?.["filter[bounced|eq]"]).toBe("1");
    expect(criteria.props.value.filters?.["filter[verified|eq]"]).toBe("");
  });

  it("an emptied filter branch clears the filters and un-flags isFiltered, keeps the sort and the page SIZE, and returns to the first page", () => {
    const criteria = bootCriteria();
    criteria.set({ sort: [{ field: "email", dir: "asc" }] });
    criteria.set({ filters: { verified: { eq: false } } });

    criteria.set({ filters: {} });

    expect(criteria.model.value.filters).toBeUndefined();
    expect(criteria.isFiltered.value).toBe(false);
    expect(criteria.model.value.sort).toEqual([{ field: "email", dir: "asc" }]);
    expect(criteria.model.value.pagination).toEqual({
      limit: DECLARED_LIMIT,
      offset: 0
    });
  });
});

describe("client-email query criteria — the ajv verdict surfaces (FB5c)", () => {
  it("a limit below the declared minimum surfaces 422 and leaves the live pagination standing", () => {
    const criteria = bootCriteria();
    criteria.set({ pagination: { limit: 2 } });

    criteria.set({ pagination: { limit: -5 } });

    const verdict = ajvVerdict(criteria);
    expect(verdict.status).toBe(422);
    expect(verdict.keywords).toContain("minimum");
    expect(verdict.paths).toContain("/pagination/limit");
    expect(criteria.model.value.pagination).toEqual({ limit: 2 });
    expect(criteria.props.value.pagination).toEqual({ limit: 2 });
  });

  it("the surfaced message is an i18n key, never English prose", () => {
    const criteria = bootCriteria();

    criteria.set({ pagination: { limit: -5 } });

    expect(ajvVerdict(criteria).message).toBe(VALIDATION_ERROR_KEY);
  });

  it("a wrong-typed filter value surfaces the ajv type error and leaves the live filter standing", () => {
    const criteria = bootCriteria();
    criteria.set({ filters: { email: { like: "mock-email-3" } } });

    criteria.set({ filters: { email: { like: 123 } } } as never);

    const verdict = ajvVerdict(criteria);
    expect(verdict.keywords).toContain("type");
    expect(verdict.paths).toContain("/filters/email/like");
    expect(criteria.model.value.filters).toEqual({
      email: { like: "mock-email-3" }
    });
    expect(criteria.props.value.filters?.["filter[email|like]"]).toBe(
      "%mock-email-3%"
    );
  });

  it("the next valid set clears the surfaced verdict", () => {
    const criteria = bootCriteria();
    criteria.set({ pagination: { limit: -5 } });
    expect(criteria.error.value).toBeDefined();

    criteria.set({ pagination: { limit: 2 } });

    expect(criteria.error.value).toBeUndefined();
  });
});

describe("client-email query criteria — the untrusted seed model (Task 41)", () => {
  it("a valid seed boots the list already filtered, sorted and paged — no unfiltered first fetch to correct", () => {
    const criteria = bootCriteria({
      filters: { verified: { eq: true } },
      sort: [{ field: "email", dir: "asc" }],
      pagination: { limit: 25 }
    });

    expect(criteria.model.value.filters).toEqual({ verified: { eq: true } });
    expect(criteria.model.value.sort).toEqual([{ field: "email", dir: "asc" }]);
    expect(criteria.model.value.pagination).toEqual({ limit: 25 });
    expect(criteria.props.value.filters?.["filter[verified|eq]"]).toBe("1");
    expect(criteria.isFiltered.value).toBe(true);
    expect(criteria.error.value).toBeUndefined();
  });

  it("an invalid seed is discarded WHOLE — its valid branches go too, and the verdict is held", () => {
    const criteria = bootCriteria({
      filters: { verified: { eq: true } },
      sort: [{ field: "email", dir: "asc" }],
      pagination: { limit: -5 }
    });

    expect(criteria.model.value.filters).toBeUndefined();
    expect(criteria.model.value.sort).toEqual(DEFAULT_SORT);
    expect(criteria.model.value.pagination).toEqual({ limit: DECLARED_LIMIT });
    expect(criteria.isFiltered.value).toBe(false);

    const verdict = ajvVerdict(criteria);
    expect(verdict.status).toBe(422);
    expect(verdict.keywords).toContain("minimum");
  });

  it("the held seed verdict survives until the next set, then clears", () => {
    const criteria = bootCriteria({ pagination: { limit: -5 } });
    expect(criteria.error.value).toBeDefined();

    criteria.set({ filters: { verified: { eq: false } } });

    expect(criteria.error.value).toBeUndefined();
    expect(criteria.model.value.filters).toEqual({ verified: { eq: false } });
  });

  it("an undeclared branch in the seed is dropped by the parse, not surfaced as a failure", () => {
    const criteria = bootCriteria({
      filters: { title: { like: "x" } }
    } as never);

    expect(criteria.model.value.filters).toBeUndefined();
    expect(criteria.error.value).toBeUndefined();
  });
});
