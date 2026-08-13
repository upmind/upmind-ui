// -----------------------------------------------------------------------------
/**
 * @fileoverview The clear law — a cleared column leaves the WIRE (P1-R7)
 *
 * ## Job To Be Done
 * Clearing a tri-state filter back to "All" must take its param off the next
 * request and bring the unfiltered rows back. The operator's report is that it
 * does neither: the control reads "All" while the table stays on the last
 * yes/no.
 *
 * Three clears are measured, because "cleared" has three candidate shapes and
 * only the wire can say which the core honours:
 *   1. the branch written EMPTY — `{ filters: {} }`;
 *   2. the LEAF written empty — `{ filters: { verified: {} } }`, which is
 *      exactly what the shipped renderer emits (`filter-clear.test.ts` asserts
 *      the leaf is `{}` after the ✕);
 *   3. the same two through `filterBy`, the verb the playground's control reaches.
 *
 * ## What Breaks If These Fail
 * The core merge (`assign({}, intent, next, cursor)`) is replacing the filters
 * branch but the TRANSLATOR is keeping an emptied column on the url, so no
 * layer above can clear anything. If they PASS, R7 does not live in core.
 *
 * ## Provenance
 * `installFilteredEmailsHandler` branches on the request's OWN params and
 * answers from the recorded captures — a filter that never reaches the wire
 * shows up as rows that never widen.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installFilteredEmailsHandler,
  observeEmailRequests,
  recorded,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";
import { filter, last, map, size } from "lodash-es";
import type { ClientEmailListQuery, QueryModel } from "../client-email.types";
import "./setup.integration";

// -----------------------------------------------------------------------------

type Collection = ReturnType<ReturnType<typeof useClientEmails>["as"]>;

const UNVERIFIED_FILTER = { verified: { eq: false } };
const VERIFIED_PARAM = "filter[verified|eq]";

/** A write no earlier step can produce, so the wire has to answer it. */
const SETTLE_SORT = [{ field: "email", dir: "asc" as const }];
const SETTLE_ORDER = "email";

const idsOf = (rows: { id: string }[]) => map(rows, "id");

const corpusIds = () =>
  idsOf([...recorded.pageOne().data, ...recorded.pageTwo().data]);

const unverifiedIds = () =>
  idsOf(
    filter([...recorded.pageOne().data, ...recorded.pageTwo().data], {
      verified: false
    })
  );

function handleOf(emails: Collection): ClientEmailListQuery {
  return (emails.useInternals() as unknown as { query: ClientEmailListQuery })
    .query;
}

async function bootFilteredCollection(): Promise<{
  emails: Collection;
  observed: ReturnType<typeof observeEmailRequests>;
}> {
  const { clientId } = await seedClientSession();
  installFilteredEmailsHandler(server, clientId);
  const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();
  await vi.waitFor(() =>
    expect(idsOf(emails.useContext().data.value)).toEqual(corpusIds())
  );
  return { emails, observed: observeEmailRequests() };
}

const filterKeysOn = (url: string): string[] =>
  [...new URL(url).searchParams.keys()].filter(key =>
    key.startsWith("filter[")
  );

const latestUrl = (observed: ReturnType<typeof observeEmailRequests>): string =>
  last(observed.all())!.url;

/**
 * Forces one more request through a sort no earlier step wrote, so the claim
 * "the param left the wire" is read off a request that exists — a clear that
 * lands back on a cached combination issues none of its own.
 */
async function settle(
  emails: Collection,
  observed: ReturnType<typeof observeEmailRequests>
): Promise<string> {
  handleOf(emails).setCriteria({ sort: SETTLE_SORT });
  await vi.waitFor(() =>
    expect(new URL(latestUrl(observed)).searchParams.get("order")).toBe(
      SETTLE_ORDER
    )
  );
  return latestUrl(observed);
}

/** Sets `verified=false` and proves it reached the wire before anything clears. */
async function applyUnverified(
  emails: Collection,
  observed: ReturnType<typeof observeEmailRequests>
): Promise<void> {
  handleOf(emails).setCriteria({ filters: UNVERIFIED_FILTER });
  await vi.waitFor(() =>
    expect(new URL(latestUrl(observed)).searchParams.get(VERIFIED_PARAM)).toBe(
      "0"
    )
  );
  await vi.waitFor(() =>
    expect(idsOf(emails.useContext().data.value)).toEqual(unverifiedIds())
  );
}

// -----------------------------------------------------------------------------

describe("clearing a filter takes it off the wire and widens the rows (P1-R7)", () => {
  it("clears when the filters BRANCH is written empty", async () => {
    const { emails, observed } = await bootFilteredCollection();
    await applyUnverified(emails, observed);

    handleOf(emails).setCriteria({ filters: {} as QueryModel["filters"] });

    await vi.waitFor(() =>
      expect(idsOf(emails.useContext().data.value)).toEqual(corpusIds())
    );
    const settled = await settle(emails, observed);
    observed.stop();

    expect(filterKeysOn(settled)).toEqual([]);
    expect(size(emails.useContext().data.value)).toBe(size(corpusIds()));
  });

  it("clears when the LEAF is written empty — the shape the renderer's ✕ emits", async () => {
    const { emails, observed } = await bootFilteredCollection();
    await applyUnverified(emails, observed);

    handleOf(emails).setCriteria({
      filters: { verified: {} } as QueryModel["filters"]
    });

    await vi.waitFor(() =>
      expect(idsOf(emails.useContext().data.value)).toEqual(corpusIds())
    );
    const settled = await settle(emails, observed);
    observed.stop();

    expect(filterKeysOn(settled)).toEqual([]);
  });

  it("clears through filterBy — the verb the playground's control reaches", async () => {
    const { emails, observed } = await bootFilteredCollection();
    emails.useActions().filterBy(UNVERIFIED_FILTER);
    await vi.waitFor(() =>
      expect(idsOf(emails.useContext().data.value)).toEqual(unverifiedIds())
    );

    emails.useActions().filterBy({ verified: {} } as QueryModel["filters"]);

    await vi.waitFor(() =>
      expect(idsOf(emails.useContext().data.value)).toEqual(corpusIds())
    );
    const settled = await settle(emails, observed);
    observed.stop();

    expect(filterKeysOn(settled)).toEqual([]);
    expect(emails.useMeta().isFiltered.value).toBe(false);
  });
});
