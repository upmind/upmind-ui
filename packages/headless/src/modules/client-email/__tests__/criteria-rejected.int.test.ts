// -----------------------------------------------------------------------------
/**
 * @fileoverview A REJECTED criteria neither reaches the wire nor destroys the
 * live one — sort, filters and pagination alike (the B5 law).
 *
 * ## Job To Be Done
 * "One source of truth for sorting, filters and pagination through the query
 * layer" is only true if an intent ajv refuses has **no** effect. The failure
 * this file exists to catch had three limbs at once, all reachable from one
 * click in the playground:
 *
 * 1. the invalid field entered the model, so the table header drew `Title ▲`;
 * 2. the translator then filtered it back out, so `props.sort` collapsed to
 *    `[]` — and because `props` is the query's reactive key, the collection
 *    **re-fetched unsorted**, destroying the sort the user actually chose;
 * 3. the model (what the renderer reads) and the wire (what the request
 *    carries) therefore disagreed exactly when it mattered.
 *
 * So the law is measured on all three surfaces at once, per branch: the model
 * still publishes the last VALID criteria, the wire is untouched (zero new
 * requests — not "a request with the right params", which a re-fetch would
 * also satisfy), and the ajv verdict is on the module's normal error channel.
 * FB5c is honoured because the refusal is LOUD, not because it is retained.
 *
 * ## Provenance
 * The real composable against the RECORDED corpus behind the param-branching
 * handler (`installFilteredEmailsHandler`) — the only handler shape whose
 * filter/sort assertions are not vacuous. No hand-authored bodies.
 *
 * ## What Breaks If These Fail
 * Six of the playground's seven sortable headers clear the user's sort and re-query
 * unsorted, the table draws a sort the request does not carry, and a hand-edited
 * `?limit=-5` in the address bar reaches the API as a rejected model.
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
import { filter, last, map } from "lodash-es";

// -----------------------------------------------------------------------------

type Collection = Awaited<ReturnType<typeof bootCollection>>;
type Observed = ReturnType<typeof observeEmailRequests>;

/** Long enough for a re-key to have fetched, had one been going to. */
const SETTLE_MS = 400;

async function bootCollection(): Promise<
  ReturnType<ReturnType<typeof useClientEmails>["as"]>
> {
  const { clientId } = await seedClientSession();
  installFilteredEmailsHandler(server, clientId);
  const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();
  return emails;
}

const paramsOf = (request: { url: string }) =>
  new URL(request.url).searchParams;

/** Every search param of the most recent observed request, as a plain object. */
function latestWire(observed: Observed): Record<string, string> {
  const latest = last(observed.all());
  return latest ? Object.fromEntries(paramsOf(latest).entries()) : {};
}

/** The ajv verdict the criteria published, read off the module's error channel. */
function criteriaVerdict(emails: Collection): {
  status?: number;
  keywords: string[];
  paths: string[];
} {
  const error = emails.useContext().error.value as unknown as
    | { status?: number; data?: { keyword: string; instancePath: string }[] }
    | undefined;
  return {
    status: error?.status,
    keywords: map(error?.data ?? [], entry => entry.keyword),
    paths: map(error?.data ?? [], entry => entry.instancePath)
  };
}

// -----------------------------------------------------------------------------

describe("client-email — an undeclared SORT field leaves the live sort on the wire (B5)", () => {
  it("keeps order=-email, fires no request from the rejected model, and surfaces the enum verdict", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    // The valid sort FIRST — without it there is no live state to destroy, which
    // is why the original read-back could not see this failure at all.
    emails.useActions().sortBy([{ field: "email", dir: "desc" }]);
    await vi.waitFor(() => expect(latestWire(observed).order).toBe("-email"));
    const requestsBefore = observed.all().length;

    emails.useActions().sortBy([{ field: "title", dir: "asc" }] as never);
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
    observed.stop();

    expect(observed.all().length).toBe(requestsBefore);
    expect(latestWire(observed).order).toBe("-email");
    expect(emails.useContext().query.value.sort).toEqual([
      { field: "email", dir: "desc" }
    ]);

    const verdict = criteriaVerdict(emails);
    expect(verdict.status).toBe(422);
    expect(verdict.keywords).toContain("enum");
    expect(verdict.paths).toContain("/sort/0/field");
  });

  it("the model the renderer reads and the wire the request carries never disagree", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().sortBy([{ field: "email", dir: "desc" }]);
    await vi.waitFor(() => expect(latestWire(observed).order).toBe("-email"));

    emails.useActions().sortBy([{ field: "title", dir: "asc" }] as never);
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
    observed.stop();

    // The two published reads of the same criteria — `useContext().query` (what
    // the table header draws from) and `query.criteria` (what the port and the
    // url sync read) — plus the wire, all agreeing on ONE sort.
    const model = emails.useContext().query.value;
    expect(emails.useInternals().query.criteria.value).toEqual(model);
    expect(latestWire(observed).order).toBe("-email");
    expect(model.sort).toEqual([{ field: "email", dir: "desc" }]);
  });

  it("the next VALID sort clears the verdict and re-queries", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().sortBy([{ field: "title", dir: "asc" }] as never);
    await vi.waitFor(() =>
      expect(criteriaVerdict(emails).keywords).toContain("enum")
    );

    emails.useActions().sortBy([{ field: "email", dir: "asc" }]);

    await vi.waitFor(() => expect(latestWire(observed).order).toBe("email"));
    observed.stop();
    expect(emails.useContext().error.value).toBeUndefined();
  });
});

describe("client-email — a REJECTED filter value leaves the live filter on the wire (B5)", () => {
  it("keeps filter[email|like], fires no request from the rejected model, and surfaces the type verdict", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useActions().filterBy({ email: { like: "mock-email-3" } });
    await vi.waitFor(() =>
      expect(latestWire(observed)["filter[email|like]"]).toBe("%mock-email-3%")
    );
    const requestsBefore = observed.all().length;

    emails.useActions().filterBy({ email: { like: 123 } } as never);
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
    observed.stop();

    expect(observed.all().length).toBe(requestsBefore);
    expect(latestWire(observed)["filter[email|like]"]).toBe("%mock-email-3%");
    expect(emails.useContext().query.value.filters).toEqual({
      email: { like: "mock-email-3" }
    });
    expect(emails.useMeta().isFiltered.value).toBe(true);

    const verdict = criteriaVerdict(emails);
    expect(verdict.status).toBe(422);
    expect(verdict.keywords).toContain("type");
    expect(verdict.paths).toContain("/filters/email/like");
  });

  it("the rows on screen still match the filter that IS applied", async () => {
    const emails = await bootCollection();

    emails.useActions().filterBy({ verified: { eq: false } });
    await vi.waitFor(() =>
      expect(emails.useContext().data.value.length).toBe(2)
    );

    emails.useActions().filterBy({ verified: { eq: "nope" } } as never);
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));

    expect(emails.useContext().data.value.length).toBe(2);
    expect(emails.useContext().query.value.filters).toEqual({
      verified: { eq: false }
    });
    expect(criteriaVerdict(emails).paths).toContain("/filters/verified/eq");
  });
});

describe("client-email — a REJECTED pagination leaves the live page on the wire (B5, W3)", () => {
  it("keeps limit=2, fires no request from the rejected model, and surfaces the minimum verdict", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();
    const query = emails.useInternals().query;

    query.setCriteria({ pagination: { limit: 2, offset: 0 } });
    await vi.waitFor(() => expect(latestWire(observed).limit).toBe("2"));
    const requestsBefore = observed.all().length;

    query.setCriteria({ pagination: { limit: -5 } });
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
    observed.stop();

    expect(observed.all().length).toBe(requestsBefore);
    expect(latestWire(observed).limit).toBe("2");
    expect(emails.useContext().query.value.pagination).toEqual({
      limit: 2,
      offset: 0
    });

    const verdict = criteriaVerdict(emails);
    expect(verdict.status).toBe(422);
    expect(verdict.keywords).toContain("minimum");
    expect(verdict.paths).toContain("/pagination/limit");
  });

  it("no observed request ever carried a negative limit", async () => {
    const emails = await bootCollection();
    const observed = observeEmailRequests();

    emails.useInternals().query.setCriteria({ pagination: { limit: -5 } });
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
    observed.stop();

    expect(
      filter(
        observed.all(),
        request => Number(paramsOf(request).get("limit")) < 0
      )
    ).toEqual([]);
  });
});

describe("client-email — a refused criteria is a verdict, not a module error", () => {
  it("leaves meta.hasError false so resolveModuleState keeps the surface `ready`, and carries the verdict on context.error alone", async () => {
    const emails = await bootCollection();

    emails.useActions().sortBy([{ field: "title", dir: "asc" }] as never);
    await vi.waitFor(() =>
      expect(criteriaVerdict(emails).keywords).toContain("enum")
    );

    // The two channels are deliberately separate: nothing failed to load, the
    // rows on screen are the last VALID ones, and `resolveModuleState` reads
    // meta — so raising `hasError` here would replace a correct table with an
    // error state over a write that changed nothing.
    expect(emails.useContext().error.value).toBeDefined();
    expect(emails.useMeta().hasError.value).toBe(false);
  });
});
