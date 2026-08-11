// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview `useTableChannel` — `ControlledTableChannel` over the REAL
 * client-email collection (Task 36, ADR-027 Am.3)
 *
 * ## Job To Be Done
 * `useTableChannel` is the only bridge between the harness's frozen FLAT
 * `TableModel` / `TableIntent` and the client-email module's NESTED query
 * model, so it is driven here against the real
 * `useClientEmails().as(ScopeActorTypes.CLIENT)` cell and the RECORDED 3-row
 * corpus: `read()` flattens the live `useContext().query` + `.pagination` DOWN
 * to the renderer, and every `TableIntent` lifts UP into the composable's own
 * `filterBy` / `sortBy` / `nextPage` / `prevPage`, the channel owning no state
 * of its own.
 *
 * ## Lane
 * The channel is playground source, so its proof runs in the playground's own
 * suite beside it — a spec in `packages/headless` reaching back out to
 * `playgrounds/` inverts the package boundary (`@workspace/no-cross-package-path-imports`).
 * Nothing headless-owned moves with it: the collection behaviours these
 * assertions ride on are each already proven inside headless — the boot
 * pagination window and the two refused paginate keys in
 * `client-email.collection.int.test.ts`, `filterBy` / `sortBy` reaching the
 * wire in `list-criteria.int.test.ts` and `translate-query.int.test.ts`, the
 * live page-size change through `setCriteria({ pagination })` in
 * `list-criteria.int.test.ts`. What is proven here, and only here, is the
 * channel's own flatten/lift contract.
 *
 * The recorded corpus, its replay server and the session seed are reached by
 * the test-lane-only `@upmind-automation/headless-test-kit` alias
 * (`vitest.config.ts`), never by a relative path into the package.
 *
 * ## The one-page × paginate collision — RECORDED, not a passing capability
 * The recorded corpus is 3 rows and the schema declares `pagination.limit`
 * `default: 10` (Wave A moved the default out of the service call site and off
 * `0`, design §11.4), so `pageTotal` is still 1 and BOTH paginate branches
 * raise out of `emit()`: a step up throws `text.page_next_not_available`, a
 * step down `text.page_previous_not_available`. Asserted below as the shipped
 * behaviour — the two distinct keys are also what prove the ±1 branch
 * discriminates direction — and an intent's `perPage` still never reaches the
 * model or the wire: the channel has no pagination sink of its own.
 *
 * ## What Breaks If These Fail
 * A renderer whose header controls read a synthesised or stale model, or whose
 * intents never reach the composable — the "controlled table" claim green with
 * no wiring behind it, which is exactly what an unimported channel looks like.
 */

import { describe, expect, it, vi } from "vitest";
import { ScopeActorTypes, useClientEmails } from "@upmind-automation/headless";
import {
  installFilteredEmailsHandler,
  observeEmailRequests,
  recorded,
  seedClientSession
} from "@upmind-automation/headless-test-kit/client-email.int-helpers";
import { server } from "@upmind-automation/headless-test-kit/setup.integration";
import { useTableChannel } from "../useTableChannel";

// -----------------------------------------------------------------------------

// The lane this spec left gave replayed integration specs 30s (headless's
// `integration` project); this suite's default is the playground's 5s.
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

type Collection = ReturnType<ReturnType<typeof useClientEmails>["as"]>;
type Channel = ReturnType<typeof useTableChannel>;

/** The `pagination.limit` default `useQuerySchema()` declares (design §11.4). */
const DECLARED_LIMIT = 10;

/** Every row the recorded corpus serves — the two page-1 rows plus page-2's. */
function corpusSize(): number {
  return recorded.pageOne().data.length + recorded.pageTwo().data.length;
}

/** The real collection plus its channel, booted against the recorded corpus. */
async function bootChannel(): Promise<{
  emails: Collection;
  channel: Channel;
}> {
  const { clientId } = await seedClientSession();
  installFilteredEmailsHandler(server, clientId);
  const emails = useClientEmails().as(ScopeActorTypes.CLIENT);
  await emails.useActions().isReady();
  return { emails, channel: useTableChannel(emails) };
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

/** Every observed value of `key`, in order, skipping requests that omit it. */
function paramValues(
  observed: ReturnType<typeof observeEmailRequests>,
  key: string
): string[] {
  return observed
    .all()
    .map(request => new URL(request.url).searchParams.get(key))
    .filter((value): value is string => value !== null);
}

// -----------------------------------------------------------------------------

describe("client-email table channel — read() flattens the live model down (Task 36)", () => {
  it("reads the boot sort, an empty filter slice and the page window the SCHEMA declares", async () => {
    const { emails, channel } = await bootChannel();

    expect(channel.read()).toEqual({
      filter: {},
      sort: [{ field: "created_at", dir: "desc" }],
      pagination: { page: 1, perPage: DECLARED_LIMIT, total: corpusSize() }
    });
    expect(emails.useContext().pagination.value).toMatchObject({
      limit: DECLARED_LIMIT,
      page: 1,
      pages: 1
    });
    expect(emails.useContext().query.value.pagination).toEqual({
      limit: DECLARED_LIMIT
    });
  });

  it("reads a sort applied through the composable's own action, not a channel copy", async () => {
    const { emails, channel } = await bootChannel();

    emails.useActions().sortBy([{ field: "email", dir: "asc" }]);

    await vi.waitFor(() =>
      expect(channel.read().sort).toEqual([{ field: "email", dir: "asc" }])
    );
    expect(emails.useContext().query.value.sort).toEqual([
      { field: "email", dir: "asc" }
    ]);
  });

  it("flattens the nested filter model to one flat value per wire column", async () => {
    const { emails, channel } = await bootChannel();

    emails.useActions().filterBy({ verified: { eq: false } });
    await vi.waitFor(() =>
      expect(channel.read().filter).toEqual({
        verified: false
      })
    );

    emails.useActions().filterBy({ email: { like: "mock-email-3" } });
    await vi.waitFor(() =>
      expect(channel.read().filter).toEqual({ email: "mock-email-3" })
    );
  });

  it("reads the live total as the collection narrows, never the boot snapshot", async () => {
    const { emails, channel } = await bootChannel();
    expect(channel.read().pagination.total).toBe(corpusSize());

    emails.useActions().filterBy({ email: { like: "mock-email-3" } });

    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(1)
    );
    expect(channel.read().pagination.total).toBe(1);
  });
});

describe("client-email table channel — emit() lifts intent up into the real actions (Task 36)", () => {
  it("a filter intent lifts the flat slice onto the schema's operator, re-queries, and round-trips through read()", async () => {
    const { emails, channel } = await bootChannel();
    const observed = observeEmailRequests();

    channel.emit({ type: "filter", model: { verified: false } });

    await vi.waitFor(() =>
      expect(paramValues(observed, "filter[verified|eq]")).toContain("0")
    );
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(2)
    );
    observed.stop();

    expect(emails.useContext().query.value.filters).toEqual({
      verified: { eq: false }
    });
    expect(channel.read().filter).toEqual({ verified: false });
  });

  it("a sort intent routes to sortBy and reaches the wire as the leading-minus order param", async () => {
    const { emails, channel } = await bootChannel();
    const observed = observeEmailRequests();

    channel.emit({ type: "sort", sort: [{ field: "email", dir: "desc" }] });

    await vi.waitFor(() =>
      expect(paramValues(observed, "order")).toContain("-email")
    );
    observed.stop();

    expect(emails.useContext().query.value.sort).toEqual([
      { field: "email", dir: "desc" }
    ]);
    expect(channel.read().sort).toEqual([{ field: "email", dir: "desc" }]);
  });

  it("a filter intent naming an undeclared column drops it and keeps the declared one", async () => {
    const { emails, channel } = await bootChannel();
    const observed = observeEmailRequests();

    channel.emit({
      type: "filter",
      model: { title: "x", verified: false }
    });

    await vi.waitFor(() =>
      expect(latestFilterKeys(observed)).toEqual(["filter[verified|eq]"])
    );
    observed.stop();

    expect(emails.useContext().query.value.filters).toEqual({
      verified: { eq: false }
    });
    expect(channel.read().filter).toEqual({ verified: false });
  });
});

describe("client-email table channel — the paginate ±1 branch on a one-page window (Task 36)", () => {
  it("a step up routes to nextPage, which a 3-row corpus inside the declared window makes unavailable", async () => {
    const { emails, channel } = await bootChannel();
    const observed = observeEmailRequests();

    expect(() =>
      channel.emit({
        type: "paginate",
        page: channel.read().pagination.page + 1
      })
    ).toThrow(/page_next_not_available/);

    // Give a (wrongly) advanced cursor time to refetch before asserting silence.
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
    expect(emails.useContext().pagination.value.page).toBe(1);
    expect(channel.read().pagination.page).toBe(1);
  });

  it("a step down routes to prevPage — the distinct key is what proves the branch reads direction", async () => {
    const { channel } = await bootChannel();

    expect(() =>
      channel.emit({
        type: "paginate",
        page: channel.read().pagination.page - 1
      })
    ).toThrow(/page_previous_not_available/);
  });

  it("a jump past the next page is still one step up — the intent's page is a direction, not a target", async () => {
    const { channel } = await bootChannel();

    expect(() => channel.emit({ type: "paginate", page: 5 })).toThrow(
      /page_next_not_available/
    );
  });

  it("a paginate intent for the current page is a no-op, and its perPage reaches neither the model nor the wire", async () => {
    const { emails, channel } = await bootChannel();
    const observed = observeEmailRequests();

    channel.emit({
      type: "paginate",
      page: channel.read().pagination.page,
      perPage: 2
    });

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
    expect(emails.useContext().query.value.pagination).toEqual({
      limit: DECLARED_LIMIT
    });
    expect(channel.read().pagination.perPage).toBe(DECLARED_LIMIT);
  });
});
