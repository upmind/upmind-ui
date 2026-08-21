// -----------------------------------------------------------------------------
/**
 * @fileoverview criteria on query() and listInfinite() — the other two entry points (Task 42/44)
 *
 * ## Job To Be Done
 * `list()` was never the only entry point holding the write-only-setter defect:
 * `query()` and `listInfinite()` carry the identical `sort` ref / `filters` ref
 * / `reactiveKeys` triple. The operator ruled both IN scope at Checkpoint A,
 * each matching what it already takes — `listInfinite()` gets the full
 * treatment; `query()` is declared through `Omit<QueryParams, "pagination">`,
 * so it gets **filters and sort and no pagination**. This file proves each
 * against the captured wire, and proves the ASYMMETRY is real rather than
 * assumed: the same declared schema carries a `pagination` branch, and `query()`
 * still sends no `limit=` / `offset=` while `listInfinite()` does.
 *
 * ## Why this lives in client-email/__tests__
 * The proof is worth nothing against a schema written for the test. The only
 * REAL declared query schema in the tree is `client-email.schemas.ts`, which
 * carries the `@internal` marker — so `modules/query/__tests__` cannot import
 * it without breaching the module-visibility law. The platform behaviour is
 * therefore proven where its real declaration is legally reachable, over this
 * module's own recorded pages behind a param-branching handler.
 *
 * ## What Breaks If These Fail
 * `query()` gaining pagination sends a `limit=` to an endpoint that has no page
 * window. `listInfinite()` losing it strands every infinite scroll on page one.
 * Either one keeping `sort()`/`filter()` beside `setCriteria` restores the two
 * write paths into one state that Wave A exists to remove.
 */

import { describe, expect, it, vi } from "vitest";
import { useQuery } from "../../query";
import { useQuerySchema } from "../client-email.schemas";
import {
  installPagedEmailsHandler,
  observeEmailRequests,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";
import type { QueryModel } from "../client-email.types";
import "./setup.integration";

// -----------------------------------------------------------------------------

type CriteriaHandle = {
  criteria: { value: QueryModel };
  schema: unknown;
  isFiltered: { value: boolean };
  criteriaError: { value: unknown };
  setCriteria: (next: Partial<QueryModel>) => void;
  sort?: unknown;
  filter?: unknown;
};

async function seedEmailsEndpoint(): Promise<{ clientId: string; url: URL }> {
  const { clientId } = await seedClientSession();
  installPagedEmailsHandler(server, clientId);
  return {
    clientId,
    url: useQuery().useUrl(`clients/${clientId}/emails`)
  };
}

/** The search params of the most recent observed request. */
function latestParams(
  observed: ReturnType<typeof observeEmailRequests>
): URLSearchParams {
  const latest = observed.all().at(-1);
  expect(latest).toBeDefined();
  return new URL(latest!.url).searchParams;
}

// -----------------------------------------------------------------------------

describe("criteria on query() — filters and sort, and NO pagination (client-email schema)", () => {
  it("publishes the criteria surface and drops the two raw setters", async () => {
    const { url } = await seedEmailsEndpoint();

    const simple = useQuery().query({
      url,
      queryKey: ["criteria-simple-surface"],
      withAccessToken: true,
      criteria: { schema: useQuerySchema() }
    }) as unknown as CriteriaHandle;

    expect(typeof simple.setCriteria).toBe("function");
    expect(simple.criteria.value.sort).toEqual([
      { field: "default", dir: "desc" },
      { field: "email", dir: "asc" }
    ]);
    expect(simple.schema).toEqual(useQuerySchema());
    expect(simple.sort).toBeUndefined();
    expect(simple.filter).toBeUndefined();
  });

  it("puts the declared sort on the wire as order= and carries no limit=/offset=", async () => {
    const { url } = await seedEmailsEndpoint();
    const observed = observeEmailRequests();

    useQuery().query({
      url,
      queryKey: ["criteria-simple-boot"],
      withAccessToken: true,
      criteria: { schema: useQuerySchema() }
    });

    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const params = latestParams(observed);
    expect(params.get("order")).toBe("-default,email");
    expect(params.get("limit")).toBeNull();
    expect(params.get("offset")).toBeNull();
  });

  it("a live setCriteria re-keys the query and puts the filter on the wire", async () => {
    const { url } = await seedEmailsEndpoint();
    const simple = useQuery().query({
      url,
      queryKey: ["criteria-simple-filter"],
      withAccessToken: true,
      criteria: { schema: useQuerySchema() }
    }) as unknown as CriteriaHandle;
    const observed = observeEmailRequests();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));

    simple.setCriteria({ filters: { verified: { eq: false } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[verified|eq]")).toBe("0")
    );
    observed.stop();
    expect(latestParams(observed).get("limit")).toBeNull();
    expect(simple.isFiltered.value).toBe(true);
  });

  it("a pagination branch in the model still never reaches query()'s wire", async () => {
    const { url } = await seedEmailsEndpoint();
    const simple = useQuery().query({
      url,
      queryKey: ["criteria-simple-pagination"],
      withAccessToken: true,
      criteria: { schema: useQuerySchema() }
    }) as unknown as CriteriaHandle;
    const observed = observeEmailRequests();
    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));

    simple.setCriteria({
      pagination: { limit: 2 },
      sort: [{ field: "email", dir: "asc" }]
    });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("email")
    );
    observed.stop();
    expect(simple.criteria.value.pagination).toEqual({ limit: 2 });
    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      expect(params.get("limit")).toBeNull();
      expect(params.get("offset")).toBeNull();
    }
  });

  it("an invalid model surfaces on criteriaError, not on the fetch error", async () => {
    const { url } = await seedEmailsEndpoint();
    const simple = useQuery().query({
      url,
      queryKey: ["criteria-simple-error"],
      withAccessToken: true,
      criteria: { schema: useQuerySchema() }
    }) as unknown as CriteriaHandle;

    simple.setCriteria({ pagination: { limit: -5 } });

    await vi.waitFor(() =>
      expect(
        (simple.criteriaError.value as { status?: number } | undefined)?.status
      ).toBe(422)
    );
  });
});

describe("criteria on listInfinite() — the full treatment (client-email schema)", () => {
  it("publishes the criteria surface and drops the two raw setters", async () => {
    const { url } = await seedEmailsEndpoint();

    const infinite = useQuery().listInfinite({
      url,
      queryKey: ["criteria-infinite-surface"],
      withAccessToken: true,
      criteria: { schema: useQuerySchema() }
    }) as unknown as CriteriaHandle;

    expect(typeof infinite.setCriteria).toBe("function");
    expect(infinite.schema).toEqual(useQuerySchema());
    expect(infinite.sort).toBeUndefined();
    expect(infinite.filter).toBeUndefined();
  });

  it("carries the declared page window on the wire — limit= and offset= both present", async () => {
    const { url } = await seedEmailsEndpoint();
    const observed = observeEmailRequests();

    useQuery().listInfinite({
      url,
      queryKey: ["criteria-infinite-boot"],
      withAccessToken: true,
      criteria: { schema: useQuerySchema() }
    });

    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();

    const params = latestParams(observed);
    expect(params.get("order")).toBe("-default,email");
    expect(params.get("limit")).toBe("10");
    expect(params.get("offset")).toBe("0");
  });

  it("a live setCriteria({ sort }) re-keys the query and refetches on the new order=", async () => {
    const { url } = await seedEmailsEndpoint();
    const infinite = useQuery().listInfinite({
      url,
      queryKey: ["criteria-infinite-sort"],
      withAccessToken: true,
      criteria: { schema: useQuerySchema() }
    }) as unknown as CriteriaHandle;
    const observed = observeEmailRequests();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("-default,email")
    );

    infinite.setCriteria({ sort: [{ field: "email", dir: "asc" }] });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("email")
    );
    observed.stop();
    expect(infinite.criteria.value.sort).toEqual([
      { field: "email", dir: "asc" }
    ]);
  });

  it("a live limit change reaches the wire — the same defect list() had", async () => {
    const { url } = await seedEmailsEndpoint();
    const infinite = useQuery().listInfinite({
      url,
      queryKey: ["criteria-infinite-limit"],
      withAccessToken: true,
      criteria: { schema: useQuerySchema() }
    }) as unknown as CriteriaHandle;
    const observed = observeEmailRequests();
    await vi.waitFor(() =>
      expect(latestParams(observed).get("limit")).toBe("10")
    );

    infinite.setCriteria({ pagination: { limit: 2 } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("limit")).toBe("2")
    );
    observed.stop();
    expect(latestParams(observed).get("offset")).toBe("0");
  });

  it("the merge law holds here too — a filter leaves the live sort alone", async () => {
    const { url } = await seedEmailsEndpoint();
    const infinite = useQuery().listInfinite({
      url,
      queryKey: ["criteria-infinite-merge"],
      withAccessToken: true,
      criteria: { schema: useQuerySchema() }
    }) as unknown as CriteriaHandle;
    const observed = observeEmailRequests();
    infinite.setCriteria({ sort: [{ field: "email", dir: "asc" }] });
    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("email")
    );

    infinite.setCriteria({ filters: { verified: { eq: false } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[verified|eq]")).toBe("0")
    );
    observed.stop();
    expect(latestParams(observed).get("order")).toBe("email");
    expect(infinite.criteria.value.sort).toEqual([
      { field: "email", dir: "asc" }
    ]);
  });
});
