// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email translateQuery — the wire behaviour (Task 36, S-D9)
 *
 * ## Job To Be Done
 * ONE translator turns the query model into the service's `QueryProps`. Proven
 * end-to-end through the REAL composable against the RECORDED 3-row corpus
 * behind a param-branching handler: a sort applies to the outbound `order=`
 * param and shows on the next read (`useContext().query`); an unknown field
 * never reaches the wire; a filter arrives as `filter[col|op]=` with the
 * translator's `%` wildcards and narrows the collection by re-query; a cleared
 * filter's param is ABSENT from the next request rather than stale; and the
 * search box binds `filters.email.like` — no `query=`/`q=`/`search=` (Task 39).
 *
 * The operator rulings of 2026-08-06 replaced the four hand-rolled helpers this
 * pipeline used to run on, so the last three describes below prove the
 * REPLACEMENTS rather than the deleted functions: the sort floor is the schema's
 * own `default` (FB5e, was `assertSortFloor`/`forcedSortHead`), the empty
 * container is stripped by `useModelParser`'s `preserveContainers: false` (FB5a,
 * was `pruneQuery`), and a model that still fails validation SURFACES its ajv
 * errors on `useContext().error` instead of being quietly discarded (FB5c, was
 * `acceptOrRetain`). The parser flag's own contract is proven at
 * `utils/__tests__/useValidation.model-parser.test.ts`.
 *
 * ## What Breaks If These Fail
 * A merge-not-replace leaves stale `filter[…]` on the wire (an HTTP 500); a
 * mis-mapped direction ships `order=desccreated_at`; an ungated field ships an
 * `order=` an unknown column 500s on; a swallowed validation error shows the
 * user a filter they never asked for with nothing to say why.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { DEFAULT_SORT } from "../client-email.types";
import {
  installFilteredEmailsHandler,
  observeEmailRequests,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

type Collection = Awaited<ReturnType<typeof bootCollection>>;

async function bootCollection(): Promise<
  ReturnType<ReturnType<typeof useClientEmails>["as"]>
> {
  const { clientId } = await seedClientSession();
  installFilteredEmailsHandler(server, clientId);
  const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();
  return emails;
}

/** The last observed value of `key`, skipping requests that omit it. */
function lastParam(
  observed: ReturnType<typeof observeEmailRequests>,
  key: string
): string | undefined {
  const values = observed
    .all()
    .map(request => new URL(request.url).searchParams.get(key))
    .filter((value): value is string => value !== null);
  return values.at(-1) ?? undefined;
}

/** The `order=` value of the last observed request carrying one, or `undefined`. */
function lastOrder(
  observed: ReturnType<typeof observeEmailRequests>
): string | undefined {
  return lastParam(observed, "order");
}

/** Every `filter[…]` key on the most recent observed request. */
function latestFilterKeys(
  observed: ReturnType<typeof observeEmailRequests>
): string[] {
  const latest = observed.all().at(-1);
  if (!latest) return [];
  return [...new URL(latest.url).searchParams.keys()].filter(key =>
    key.startsWith("filter[")
  );
}

/** The ajv errors the collection surfaced on its normal error channel (FB5c). */
function surfacedAjvErrors(
  emails: Collection
): { keyword: string; instancePath: string }[] {
  const error = emails.useContext().error.value as unknown as
    | { status?: number; data?: { keyword: string; instancePath: string }[] }
    | undefined;
  return error?.data ?? [];
}

// -----------------------------------------------------------------------------

describe("client-email table channel + translateQuery — sort (Task 36)", () => {
  it("an ascending sort applies order=field and shows on the next read()", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().sortBy([{ field: "created_at", dir: "asc" }]);

    await vi.waitFor(() => expect(lastOrder(observed)).toBe("created_at"));
    observed.stop();
    expect(emails.useContext().query.value.sort).toEqual([
      { field: "created_at", dir: "asc" }
    ]);
  });

  it("a descending sort applies the leading-minus form order=-field", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    // `email`, not `created_at`: the DEFAULT_SORT is already `created_at desc`,
    // so re-sorting to it is an isEqual no-op that never reaches the wire.
    emails.useActions().sortBy([{ field: "email", dir: "desc" }]);

    await vi.waitFor(() => expect(lastOrder(observed)).toBe("-email"));
    observed.stop();
    expect(emails.useContext().query.value.sort).toEqual([
      { field: "email", dir: "desc" }
    ]);
  });

  it("a two-key sort applies comma-separated, precedence = position", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().sortBy([
      { field: "default", dir: "desc" },
      { field: "created_at", dir: "asc" }
    ]);

    await vi.waitFor(() =>
      expect(lastOrder(observed)).toBe("-default,created_at")
    );
    observed.stop();
  });

  it("an undeclared sort field never reaches the wire, and surfaces the ajv enum error", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().sortBy([{ field: "title", dir: "asc" }]);

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    const orders = observed
      .all()
      .map(request => new URL(request.url).searchParams.get("order") ?? "");
    expect(orders.some(order => order.includes("title"))).toBe(false);

    const surfaced = surfacedAjvErrors(emails);
    expect(surfaced.map(entry => entry.keyword)).toContain("enum");
    expect(surfaced.map(entry => entry.instancePath)).toContain(
      "/sort/0/field"
    );
  });
});

describe("client-email sort — the schema's default IS the floor (FB5e)", () => {
  it("boots on the sort the schema declares as its default", async () => {
    const emails = await bootCollection();

    expect(emails.useContext().query.value.sort).toEqual(DEFAULT_SORT);
  });

  it("an emptied sort refills from the default and re-queries order=-created_at", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().sortBy([{ field: "email", dir: "desc" }]);
    await vi.waitFor(() => expect(lastOrder(observed)).toBe("-email"));

    emails.useActions().sortBy([]);

    await vi.waitFor(() => expect(lastOrder(observed)).toBe("-created_at"));
    observed.stop();
    expect(emails.useContext().query.value.sort).toEqual(DEFAULT_SORT);
    // The refill precedes validation, so the schema's `minItems: 1` never fires.
    expect(surfacedAjvErrors(emails)).toEqual([]);
  });
});

describe("client-email filters — translateQuery (Task 35/36, Task 39)", () => {
  it("a free-text search binds filter[email|like] with the translator's % wildcards, no query=/q=/search=", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().filterBy({ email: { like: "mock-email-3" } });

    await vi.waitFor(() => {
      const like = observed
        .all()
        .map(request =>
          new URL(request.url).searchParams.get("filter[email|like]")
        )
        .filter((value): value is string => value !== null);
      expect(like).toContain("%mock-email-3%");
    });
    observed.stop();

    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      expect(params.get("query")).toBeNull();
      expect(params.get("q")).toBeNull();
      expect(params.get("search")).toBeNull();
    }
  });

  it("a boolean filter arrives as filter[col|eq]=0 and narrows the collection by re-query", async () => {
    const emails = await bootCollection();
    await vi.waitFor(() =>
      expect(emails.useContext().data.value.length).toBe(3)
    );

    const observed = observeEmailRequests();
    emails.useActions().filterBy({ verified: { eq: false } });

    await vi.waitFor(() => {
      const flags = observed
        .all()
        .map(request =>
          new URL(request.url).searchParams.get("filter[verified|eq]")
        )
        .filter((value): value is string => value !== null);
      expect(flags).toContain("0");
    });
    await vi.waitFor(() =>
      expect(emails.useContext().data.value.length).toBe(2)
    );
    observed.stop();
  });

  it("a second filterBy replaces rather than merges — the cleared column's param is absent", async () => {
    const emails = await bootCollection();

    emails.useActions().filterBy({ verified: { eq: false } });
    await vi.waitFor(() =>
      expect(emails.useContext().query.value.filters).toEqual({
        verified: { eq: false }
      })
    );

    const observed = observeEmailRequests();
    emails.useActions().filterBy({ default: { eq: true } });

    await vi.waitFor(() => {
      const request = observed
        .all()
        .find(
          entry =>
            new URL(entry.url).searchParams.get("filter[default|eq]") === "1"
        );
      expect(request).toBeDefined();
      expect(
        new URL(request!.url).searchParams.get("filter[verified|eq]")
      ).toBeNull();
    });
    observed.stop();
    expect(emails.useContext().query.value.filters).toEqual({
      default: { eq: true }
    });
  });
});

describe("client-email filters — an emptied container does not survive (FB5a)", () => {
  it("an emptied column is stripped by the parse — its param leaves the wire", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().filterBy({ email: { like: "mock-email-3" } });
    await vi.waitFor(() =>
      expect(lastParam(observed, "filter[email|like]")).toBe("%mock-email-3%")
    );

    emails.useActions().filterBy({ email: {} });

    await vi.waitFor(() => expect(latestFilterKeys(observed)).toEqual([]));
    observed.stop();
    expect(emails.useContext().query.value.filters).toBeUndefined();
  });

  it("a cleared bag leaves no filter param at all and surfaces no error", async () => {
    const emails = await bootCollection();

    emails.useActions().filterBy({ verified: { eq: false } });
    await vi.waitFor(() =>
      expect(emails.useContext().query.value.filters).toEqual({
        verified: { eq: false }
      })
    );

    const observed = observeEmailRequests();
    emails.useActions().filterBy({});

    await vi.waitFor(() => {
      expect(observed.all().length).toBeGreaterThan(0);
      expect(latestFilterKeys(observed)).toEqual([]);
    });
    observed.stop();
    expect(emails.useContext().query.value.filters).toBeUndefined();
    expect(surfacedAjvErrors(emails)).toEqual([]);
  });
});

describe("client-email invalid query model — the ajv errors surface (FB5c)", () => {
  it("a wrong-typed filter value surfaces the ajv type error, and never reverts to the last valid model", async () => {
    const emails = await bootCollection();

    emails.useActions().filterBy({ email: { like: "mock-email-3" } });
    await vi.waitFor(() =>
      expect(emails.useContext().query.value.filters).toEqual({
        email: { like: "mock-email-3" }
      })
    );

    emails.useActions().filterBy({ email: { like: 123 } } as never);

    await vi.waitFor(() => {
      const surfaced = surfacedAjvErrors(emails);
      expect(surfaced.map(entry => entry.keyword)).toContain("type");
      expect(surfaced.map(entry => entry.instancePath)).toContain(
        "/filters/email/like"
      );
    });
    expect(emails.useContext().query.value.filters).toEqual({
      email: { like: 123 }
    });
  });

  it("an undeclared column cannot survive the parse — nothing surfaces and nothing re-queries", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().filterBy({ title: { like: "x" } } as never);

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();
    expect(observed.all()).toEqual([]);
    expect(surfacedAjvErrors(emails)).toEqual([]);
    expect(emails.useContext().query.value.filters).toBeUndefined();
  });

  it("a valid model afterwards clears the surfaced error", async () => {
    const emails = await bootCollection();

    emails.useActions().filterBy({ email: { like: 123 } } as never);
    await vi.waitFor(() =>
      expect(surfacedAjvErrors(emails).map(entry => entry.keyword)).toContain(
        "type"
      )
    );

    emails.useActions().filterBy({ email: { like: "mock-email-3" } });

    await vi.waitFor(() =>
      expect(emails.useContext().error.value).toBeUndefined()
    );
  });
});
