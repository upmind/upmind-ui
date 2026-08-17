// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the sibling-parity criteria adapters
 * (`sortBy`/`filterBy`) and the platform table-channel path that resolves them
 *
 * ## Job To Be Done
 * The playground's sort control and filter bar write through the platform TABLE
 * CHANNEL: an emitted SORT/FILTER intent resolves `useActions().sortBy` /
 * `.filterBy` BY NAME (the `useTableChannel` mapping) and the composable applies
 * it. Those two verbs are THIN adapters — each a typed call into the ONE write
 * verb `setCriteria` (`{ sort }` / `{ filters }`), the sibling shape
 * (`client-email/useClientEmails.actions.ts` `filterBy`/`sortBy`), never the
 * withdrawn `sort()`/`filter()`/`filter[…]` façade. This drives the REAL
 * four-layer `useClientReceivedEmails().as('client')` against staging-captured,
 * MSW-replayed fixtures and proves every read-back on the OUTBOUND REQUEST
 * (verify-reality-check), never the response payload alone.
 *
 * The table-channel block reflects the real `useActions()` into the platform
 * port shape (`Record<string, fn>` — action types erased exactly as the seam
 * erases them) and emits through a `ControlledTableChannel` — the contract in
 * `@upmind-automation/scenario-harness`'s `table-channel.types.ts`
 * (`{ read, emit }`) with the seam's SORT→`sortBy` / FILTER→`filterBy` mapping.
 * The shape is mirrored inline because headless must not depend on the harness
 * (the harness reflects headless, not the reverse). If the module exposed only
 * `setCriteria` and no `sortBy`/`filterBy` (the M2 drift), the reflected verb
 * resolves `undefined` and the emit throws at runtime — the failure a masking
 * cast (`as unknown as TableChannelCell`) hides from the type-checker but a hand
 * clicking sort on the page hits.
 *
 * ## What Breaks If These Fail
 * A page whose sort control throws on click (the green-gate / undriveable-page
 * defect). A `false` boolean filter dropped is the invisible one: the "not
 * bounced" tab silently shows everything. An adapter bypassing `setCriteria` is
 * the P1-R9 second write path the closure deleted.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientReceivedEmails } from "..";
import { SortDirection } from "../../query";
import { ScopeActorTypes } from "../../scope/scope.types";
import { SENT_EMAIL_DEFAULT_SORT } from "../client-email-history.types";
import {
  installEmailHistoryHandlers,
  observeEmailHistoryRequests,
  seedClientSession
} from "./client-email-history.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

type Collection = ReturnType<ReturnType<typeof useClientReceivedEmails>["as"]>;

async function bootCollection(): Promise<Collection> {
  await seedClientSession();
  installEmailHistoryHandlers();
  const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();
  return emails;
}

/** The decoded search params of the most recent observed request. */
function latestParams(
  observed: ReturnType<typeof observeEmailHistoryRequests>
): URLSearchParams {
  const latest = observed.all().at(-1);
  expect(latest).toBeDefined();
  return new URL(latest!.url).searchParams;
}

/** Every `filter[…]` key on the most recent observed request. */
function latestFilterKeys(
  observed: ReturnType<typeof observeEmailHistoryRequests>
): string[] {
  return [...latestParams(observed).keys()].filter(key =>
    key.startsWith("filter[")
  );
}

// -----------------------------------------------------------------------------
// The platform seam, mirrored inline (see file header for why not imported).

/** The port's action surface — `CompositionPort.actions` (types erased). */
type PortActions = Record<string, (input?: unknown) => unknown>;

/** A `TableIntent` — the two the sort control / filter bar emit. */
type TableIntent =
  | { type: "sort"; sort: ReadonlyArray<{ field: string; dir: SortDirection }> }
  | { type: "filter"; model: Record<string, unknown> };

/** The `useTableChannel` intent→verb mapping. */
const INTENT_VERB = { sort: "sortBy", filter: "filterBy" } as const;

/**
 * Reflects the REAL `useActions()` into the port's `Record<string, fn>` the way
 * the platform `useModulePort` does — no key is hand-populated, so a verb is
 * present iff the composable actually exposes it.
 */
function reflectPortActions(collection: Collection): PortActions {
  const actions = collection.useActions() as Record<string, unknown>;
  const reflected: PortActions = {};
  for (const [key, value] of Object.entries(actions)) {
    if (typeof value === "function") {
      reflected[key] = (input?: unknown) =>
        (value as (received?: unknown) => unknown)(input);
    }
  }
  return reflected;
}

/** `ControlledTableChannel.emit`: resolve the intent's verb off the port and apply it. */
function emitTableIntent(actions: PortActions, intent: TableIntent): void {
  const verb = actions[INTENT_VERB[intent.type]];
  if (typeof verb !== "function") {
    throw new TypeError(
      `table channel: no live "${INTENT_VERB[intent.type]}" action to resolve`
    );
  }
  verb(intent.type === "sort" ? intent.sort : intent.model);
}

// -----------------------------------------------------------------------------

describe("client-email-history criteria adapters — sortBy routes through setCriteria (AC-6)", () => {
  it("AC-6 sortBy([subject asc]) moves the wire to order=subject and the live model to that sort", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().sortBy([{ field: "subject", dir: SortDirection.ASC }]);

    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("subject")
    );
    observed.stop();
    expect(emails.useContext().query.value.sort).toEqual([
      { field: "subject", dir: SortDirection.ASC }
    ]);
  });

  it("AC-6 clearing via sortBy(default) returns to the boot order, most recent first", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().sortBy([{ field: "subject", dir: SortDirection.ASC }]);
    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("subject")
    );

    emails.useActions().sortBy(SENT_EMAIL_DEFAULT_SORT);
    await vi.waitFor(() =>
      expect(emails.useContext().query.value.sort).toEqual(
        SENT_EMAIL_DEFAULT_SORT
      )
    );
    observed.stop();
  });
});

describe("client-email-history criteria adapters — filterBy routes through setCriteria (AC-7, AC-8)", () => {
  it("AC-8 filterBy({ sent: { eq: true } }) sends filter[sent|eq]=1 and reflects on the live model", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().filterBy({ sent: { eq: true } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[sent|eq]")).toBe("1")
    );
    observed.stop();
    expect(latestFilterKeys(observed)).toEqual(["filter[sent|eq]"]);
    expect(emails.useContext().query.value.filters).toEqual({
      sent: { eq: true }
    });
  });

  it("AC-8 filterBy keeps a FALSE boolean as filter[bounced|eq]=0 rather than dropping it", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().filterBy({ bounced: { eq: false } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[bounced|eq]")).toBe("0")
    );
    observed.stop();
    expect(emails.useContext().query.value.filters).toEqual({
      bounced: { eq: false }
    });
  });

  it("AC-7 filterBy({ subject: { like } }) sends the search as filter[subject|like], never a bare subject=/query=", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().filterBy({ subject: { like: "Welcome" } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[subject|like]")).toBe(
        "%Welcome%"
      )
    );
    observed.stop();
    const params = latestParams(observed);
    expect(params.get("subject")).toBeNull();
    expect(params.get("query")).toBeNull();
  });

  it("AC-8 filterBy({}) clears every filter key — no stale narrowing survives", async () => {
    const emails = await bootCollection();
    const observed = observeEmailHistoryRequests();

    emails.useActions().filterBy({ sent: { eq: true } });
    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[sent|eq]")).toBe("1")
    );

    emails.useActions().filterBy({});
    await vi.waitFor(() =>
      expect(emails.useContext().query.value.filters).toBeUndefined()
    );
    // A later window write proves the cleared request actually re-read.
    emails.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(latestParams(observed).get("limit")).toBe("2")
    );
    observed.stop();
    expect(latestFilterKeys(observed)).toEqual([]);
  });
});

describe("client-email-history criteria adapters — the ONE write verb, no second source (AC-8)", () => {
  it("AC-8 exposes sortBy/filterBy as thin adapters over setCriteria, with the sort()/filter() façade gone", async () => {
    const emails = await bootCollection();
    const actions = emails.useActions();

    expect(typeof actions.setCriteria).toBe("function");
    expect(typeof actions.sortBy).toBe("function");
    expect(typeof actions.filterBy).toBe("function");
    // The withdrawn options-arm façade stays gone; sortBy/filterBy are the
    // sibling-parity intent wrappers, not its return.
    expect(actions).not.toHaveProperty("sort");
    expect(actions).not.toHaveProperty("filter");
    expect(actions).not.toHaveProperty("filters");

    expect(emails.useInternals().query.isFiltered.value).toBe(false);
    actions.filterBy({ sent: { eq: true } });
    await vi.waitFor(() =>
      expect(emails.useInternals().query.isFiltered.value).toBe(true)
    );
    expect(emails.useInternals().query.criteriaError.value).toBeUndefined();
  });
});

describe("client-email-history table channel — a SORT/FILTER emit resolves the live adapter (AC-6, AC-8)", () => {
  it("AC-6 a reflected port carries sortBy/filterBy — the members the erased-type port hides from the compiler", async () => {
    const emails = await bootCollection();

    // Anti-masking-cast: the port surface is Record<string, fn>, so tsc cannot
    // see these verbs; the runtime reflection resolves them off the REAL
    // composable or they are absent (the M2 drift).
    expect(Object.keys(reflectPortActions(emails))).toEqual(
      expect.arrayContaining(["setCriteria", "sortBy", "filterBy"])
    );
  });

  it("AC-6 a SORT intent emitted through the port resolves the live sortBy and moves the wire to order=subject", async () => {
    const emails = await bootCollection();
    const actions = reflectPortActions(emails);
    const observed = observeEmailHistoryRequests();

    emitTableIntent(actions, {
      type: "sort",
      sort: [{ field: "subject", dir: SortDirection.ASC }]
    });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("order")).toBe("subject")
    );
    observed.stop();
    expect(emails.useContext().query.value.sort).toEqual([
      { field: "subject", dir: SortDirection.ASC }
    ]);
  });

  it("AC-8 a FILTER intent emitted through the port resolves the live filterBy and sends filter[sent|eq]=1", async () => {
    const emails = await bootCollection();
    const actions = reflectPortActions(emails);
    const observed = observeEmailHistoryRequests();

    emitTableIntent(actions, { type: "filter", model: { sent: { eq: true } } });

    await vi.waitFor(() =>
      expect(latestParams(observed).get("filter[sent|eq]")).toBe("1")
    );
    observed.stop();
    expect(latestFilterKeys(observed)).toEqual(["filter[sent|eq]"]);
    expect(emails.useContext().query.value.filters).toEqual({
      sent: { eq: true }
    });
  });
});
