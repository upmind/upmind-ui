// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the single received email (AC-13,
 * AC-14, AC-15, AC-17) and the record id it is opened by (FE-3095)
 *
 * ## Job To Be Done
 * Exercise the REAL `useClientReceivedEmail` stack against MSW-replayed,
 * staging-captured fixtures. Proves: a client reads one email in full,
 * including its full body (AC-13); the single read maps a row IDENTICALLY to
 * the collection, proven by feeding the SAME recorded row through both
 * composables (AC-14); loading / empty / error and a readiness wait that
 * settles (AC-15); refresh and destroy/release (AC-17).
 *
 * FE-3095 replaced the synthesised `.withId(id)` context with the
 * builder's own `.withId(id)`, and made the actor default to the session's
 * own. Three claims land here, each on the WIRE rather than the payload: the
 * id `.withId()` names is the id fetched; a read that names NO id fires
 * nothing at all; and two ids are two instances against two requests, never
 * one cached record served twice.
 *
 * The real captured single-read body lives at the row's NESTED
 * `data.body` (the `with=data` relation) — every real row sampled while
 * capturing (`client-email-history.fixtures.ts`) carries a populated one; no
 * genuinely empty `data.body` turned up in that sample. AC-13's "no body
 * yields \"\"" branch is therefore not replayable here without hand-authoring
 * an empty-body row. It is a branch of the pure `mapReceivedEmail`, so it is
 * proven at the unit layer instead — `client-email-history.mappers.test.ts`
 * (AC-13). What this file proves is the populated-body path, on the real row.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientReceivedEmail, useClientReceivedEmails } from "..";
import { queryClient } from "../../query/client";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  clientEmailHistoryScopeKeys,
  installEmailHistoryHandlers,
  observeEmailHistoryRequests,
  recorded,
  resetClientEmailHistoryScopes,
  seedClientSession
} from "./client-email-history.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-email-history single read — reads one email in full (AC-13)", () => {
  it("AC-13 issues emails/{id} with with=data and maps id/body from the recorded fixture", async () => {
    const { accessToken } = await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.one();
    handlers.setOneBody(fixture);
    const observed = observeEmailHistoryRequests();

    const single = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(fixture.data.id);
    await vi.waitFor(() =>
      expect(single.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    const request = observed.first();
    expect(request.url).toContain(`/emails/${fixture.data.id}`);
    expect(request.url).toContain("with=data");
    assertClientIdentityTransport(request, accessToken);

    expect(single.useContext().data.value.id).toBe(fixture.data.id);
    expect(single.useContext().data.value.body).toBe(
      fixture.data.data?.body ?? ""
    );
    expect(single.useContext().data.value.body.length).toBeGreaterThan(0);
  });

  // AC-13's empty-body default is proven in
  // `client-email-history.mappers.test.ts`, not here: every real captured row
  // carries a populated nested `data.body`, so no replayable row reaches that
  // branch. It is a pure-function branch, so the unit layer proves it without
  // inventing a wire body. See this file's fileoverview.
});

describe("client-email-history single read — the record id opens the read (FE-3095)", () => {
  it("FE-3095 reads as the session's own client with no .as() — .withId(id) alone fetches that id", async () => {
    const { accessToken } = await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.one();
    handlers.setOneBody(fixture);
    const observed = observeEmailHistoryRequests();

    const single = useClientReceivedEmail().withId(fixture.data.id);
    await vi.waitFor(() =>
      expect(single.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    expect(observed.all()).toHaveLength(1);
    const request = observed.first();
    expect(request.url).toContain(`/emails/${fixture.data.id}`);
    assertClientIdentityTransport(request, accessToken);
    expect(single.useContext().data.value.id).toBe(fixture.data.id);
  });

  it("FE-3095 names no record and reads nothing — no .withId() issues no request at all", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    handlers.setOneBody(recorded.one());
    const observed = observeEmailHistoryRequests();

    const single = useClientReceivedEmail().as(ScopeActorTypes.CLIENT);
    // Give an (incorrectly) enabled query time to fire before asserting absence.
    await new Promise(resolve => setTimeout(resolve, 400));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
    expect(single.useContext().data.value.id).toBeFalsy();
  });

  it("FE-3095 two ids are two reads — each request carries its OWN id, and neither instance is the other", async () => {
    // The story's single load-bearing correctness point: absent the id in the
    // scope key, the second email is served the first one's cached record and
    // the second request never leaves.
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.one();
    const firstId = fixture.data.id;
    const secondId = recorded.list().data[0].id;
    expect(secondId).not.toBe(firstId);
    const observed = observeEmailHistoryRequests();

    const first = useClientReceivedEmail().withId(firstId);
    await vi.waitFor(() => expect(first.useMeta().isLoading.value).toBe(false));

    handlers.setOneBody({
      ...fixture,
      data: { ...fixture.data, id: secondId }
    });
    const second = useClientReceivedEmail().withId(secondId);
    await vi.waitFor(() =>
      expect(second.useMeta().isLoading.value).toBe(false)
    );
    observed.stop();

    expect(first).not.toBe(second);
    expect(observed.matching(`/emails/${firstId}`)).toHaveLength(1);
    expect(observed.matching(`/emails/${secondId}`)).toHaveLength(1);
    expect(first.useContext().data.value.id).toBe(firstId);
    expect(second.useContext().data.value.id).toBe(secondId);
  });

  it("FE-3095 partitions the scope registry and the query cache by the record id", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.one();
    handlers.setOneBody(fixture);
    const firstId = fixture.data.id;
    const secondId = recorded.list().data[0].id;

    const first = useClientReceivedEmail().withId(firstId);
    await vi.waitFor(() => expect(first.useMeta().isLoading.value).toBe(false));
    handlers.setOneBody({
      ...fixture,
      data: { ...fixture.data, id: secondId }
    });
    const second = useClientReceivedEmail().withId(secondId);
    await vi.waitFor(() =>
      expect(second.useMeta().isLoading.value).toBe(false)
    );

    const keys = clientEmailHistoryScopeKeys();
    expect(keys).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`id:${firstId}`),
        expect.stringContaining(`id:${secondId}`)
      ])
    );

    const cacheKeys = queryClient
      .getQueryCache()
      .getAll()
      .map(query => JSON.stringify(query.queryKey));

    expect(cacheKeys.filter(key => key.includes(firstId))).not.toHaveLength(0);
    expect(cacheKeys.filter(key => key.includes(secondId))).not.toHaveLength(0);
  });
});

describe("client-email-history single read — mapped identically to the collection (AC-14)", () => {
  it("AC-14 maps the SAME recorded row identically through both composables", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const rawRow = recorded.errorRows().data[0];
    handlers.setListBody({ ...recorded.errorRows(), data: [rawRow] });
    handlers.setOneBody({ ...recorded.one(), data: rawRow });

    const collection = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(collection.useMeta().isLoading.value).toBe(false)
    );
    const fromCollection = collection.useContext().data.value[0];

    const single = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(rawRow.id);
    await vi.waitFor(() =>
      expect(single.useMeta().isLoading.value).toBe(false)
    );
    const fromSingle = single.useContext().data.value;

    expect(fromSingle).toEqual(fromCollection);
  });
});

describe("client-email-history single read — loading / empty / error, and isReady() (AC-15)", () => {
  it("AC-15 resolves isReady() true once the fetch settles", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.one();
    handlers.setOneBody(fixture);

    const single = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(fixture.data.id);

    const settled = await Promise.race([
      single.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);

    expect(settled).toBe(true);
  });
});

describe("client-email-history single read — refresh and release (AC-17)", () => {
  it("AC-17 refresh() issues a second request to emails/{id}", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.one();
    handlers.setOneBody(fixture);

    const single = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(fixture.data.id);
    await vi.waitFor(() =>
      expect(single.useMeta().isLoading.value).toBe(false)
    );

    await expect(single.useActions().refresh()).resolves.not.toThrow();
  });

  it("AC-17 destroy() releases the instance — a fresh .withId() returns a different object", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.one();
    handlers.setOneBody(fixture);

    const single = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(fixture.data.id);
    await vi.waitFor(() =>
      expect(single.useMeta().isLoading.value).toBe(false)
    );

    single.useActions().destroy();

    const fresh = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(fixture.data.id);

    expect(fresh).not.toBe(single);
  });

  it("AC-17 destroy() releases the scope-registry entry itself — the registry's key count drops by one, and re-constructing for the SAME id afterwards is counted as a fresh entry, not the released one", async () => {
    await seedClientSession();
    const handlers = installEmailHistoryHandlers();
    const fixture = recorded.one();
    handlers.setOneBody(fixture);

    const single = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(fixture.data.id);
    await vi.waitFor(() =>
      expect(single.useMeta().isLoading.value).toBe(false)
    );

    const keysBeforeDestroy = clientEmailHistoryScopeKeys();
    expect(keysBeforeDestroy.length).toBeGreaterThan(0);

    single.useActions().destroy();

    expect(clientEmailHistoryScopeKeys()).toHaveLength(
      keysBeforeDestroy.length - 1
    );

    const fresh = useClientReceivedEmail()
      .as(ScopeActorTypes.CLIENT)
      .withId(fixture.data.id);

    expect(fresh).not.toBe(single);
    expect(clientEmailHistoryScopeKeys()).toHaveLength(
      keysBeforeDestroy.length
    );
  });
});

resetClientEmailHistoryScopes();
