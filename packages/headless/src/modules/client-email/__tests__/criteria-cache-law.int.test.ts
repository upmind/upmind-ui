// -----------------------------------------------------------------------------
/**
 * @fileoverview The cache law — one request per DISTINCT combination (P1-R1)
 *
 * ## Job To Be Done
 * The reactive query key already carries `(filters, sort, limit, offset)`, so
 * every combination is its own cache entry and toggling a filter back and
 * forth SELECTS entries rather than fetching them. The operator counted seven
 * requests where there should have been two.
 *
 * The measure is the WIRE: the number of collection reads observed against the
 * number of distinct request signatures those reads carry. Component state
 * cannot see this — the rows are correct either way.
 *
 * ## What Breaks If These Fail
 * A branch-change `invalidateQueries` is prefix-wide, so every sibling
 * combination is marked stale and revisiting one refetches instead of serving
 * its own entry — the seven-requests-for-two the operator counted.
 *
 * ## Provenance
 * `installFilteredEmailsHandler` branches on the request's own params and
 * answers from the recorded captures.
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
import { filter, map, size, uniq } from "lodash-es";
import type { ClientEmailListQuery } from "../client-email.types";

import "./setup.integration";

// -----------------------------------------------------------------------------

type Collection = ReturnType<ReturnType<typeof useClientEmails>["as"]>;

const VERIFIED = { verified: { eq: true } };
const UNVERIFIED = { verified: { eq: false } };

/** Boot, verified, unverified — the whole combination set the toggles visit. */
const DISTINCT_COMBINATIONS = 3;

const idsOf = (rows: { id: string }[]) => map(rows, "id");

const corpusRows = () => [
  ...recorded.pageOne().data,
  ...recorded.pageTwo().data
];

const idsWhere = (verified: boolean) =>
  idsOf(filter(corpusRows(), { verified }));

function handleOf(emails: Collection): ClientEmailListQuery {
  return (emails.useInternals() as unknown as { query: ClientEmailListQuery })
    .query;
}

/** Every observed read reduced to its criteria — the cache entry it stands for. */
const signatures = (
  observed: ReturnType<typeof observeEmailRequests>
): string[] =>
  map(observed.all(), request => {
    const params = new URL(request.url).searchParams;
    params.sort();
    return params.toString();
  });

async function bootCollection(): Promise<{
  emails: Collection;
  observed: ReturnType<typeof observeEmailRequests>;
}> {
  const { clientId } = await seedClientSession();
  installFilteredEmailsHandler(server, clientId);
  const observed = observeEmailRequests();
  const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();
  await vi.waitFor(() =>
    expect(idsOf(emails.useContext().data.value)).toEqual(idsOf(corpusRows()))
  );
  return { emails, observed };
}

async function toggle(
  emails: Collection,
  filters: Record<string, unknown>,
  expected: string[]
): Promise<void> {
  handleOf(emails).setCriteria({ filters });
  await vi.waitFor(
    () => expect(idsOf(emails.useContext().data.value)).toEqual(expected),
    { timeout: 2000 }
  );
}

// -----------------------------------------------------------------------------

describe("the cache law — a combination is fetched ONCE, ever (P1-R1)", () => {
  it("issues one request per distinct combination across a four-write toggle", async () => {
    const { emails, observed } = await bootCollection();

    await toggle(emails, VERIFIED, idsWhere(true));
    await toggle(emails, UNVERIFIED, idsWhere(false));
    await toggle(emails, VERIFIED, idsWhere(true));
    await toggle(emails, UNVERIFIED, idsWhere(false));
    observed.stop();

    expect(uniq(signatures(observed))).toHaveLength(DISTINCT_COMBINATIONS);
    expect(size(signatures(observed))).toBe(DISTINCT_COMBINATIONS);
  });

  it("re-selecting a combination through filterBy costs no request at all", async () => {
    const { emails, observed } = await bootCollection();
    const actions = emails.useActions();

    actions.filterBy(VERIFIED);
    await vi.waitFor(
      () =>
        expect(idsOf(emails.useContext().data.value)).toEqual(idsWhere(true)),
      { timeout: 2000 }
    );
    actions.filterBy(UNVERIFIED);
    await vi.waitFor(
      () =>
        expect(idsOf(emails.useContext().data.value)).toEqual(idsWhere(false)),
      { timeout: 2000 }
    );
    const before = size(observed.all());

    actions.filterBy(VERIFIED);
    await vi.waitFor(
      () =>
        expect(idsOf(emails.useContext().data.value)).toEqual(idsWhere(true)),
      { timeout: 2000 }
    );
    await new Promise(resolve => setTimeout(resolve, 200));
    observed.stop();

    expect(size(observed.all()) - before).toBe(0);
  });
});
