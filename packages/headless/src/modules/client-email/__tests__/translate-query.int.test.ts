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
 * ## What Breaks If These Fail
 * A merge-not-replace leaves stale `filter[…]` on the wire (an HTTP 500); a
 * mis-mapped direction ships `order=desccreated_at`; an ungated field ships an
 * `order=` an unknown column 500s on.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installFilteredEmailsHandler,
  observeEmailRequests,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

async function bootCollection(): Promise<
  ReturnType<ReturnType<typeof useClientEmails>["as"]>
> {
  const { clientId } = await seedClientSession();
  installFilteredEmailsHandler(server, clientId);
  const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();
  return emails;
}

/** The `order=` value of the last observed request carrying one, or `undefined`. */
function lastOrder(
  observed: ReturnType<typeof observeEmailRequests>
): string | undefined {
  const withOrder = observed
    .all()
    .map(request => new URL(request.url).searchParams.get("order"))
    .filter((order): order is string => order !== null);
  return withOrder.at(-1) ?? undefined;
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

  it("an undeclared sort field never reaches the wire", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().sortBy([{ field: "title", dir: "asc" }]);

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    const orders = observed
      .all()
      .map(request => new URL(request.url).searchParams.get("order") ?? "");
    expect(orders.some(order => order.includes("title"))).toBe(false);
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
