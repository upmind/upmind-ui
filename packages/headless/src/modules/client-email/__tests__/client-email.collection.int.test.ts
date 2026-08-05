// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email collection — read, state, controls, lifecycle, guard
 *
 * ## Job To Be Done
 * Drive the REAL `useClientEmails().as('self')` through the barrel against
 * MSW-replayed staging recordings and prove:
 * AC-1 the list request is addressed to the SCOPE-RESOLVED client's own
 * resource, with that client session's token and no acting-as headers;
 * AC-3 the collection's state is readable, its readiness awaitable, and its
 *      addressability (`useMeta().isAvailable`) readable without the consumer
 *      ever inspecting the session;
 * AC-8 refresh / invalidate / filter reach the wire, the collection fetches
 * ALL addresses by default (limit=0, one page, no cursor to advance), and a
 * caller who supplies a page size gets a real paged walk;
 * AC-9 destroying the collection releases its scope entry;
 * AC-10 nothing touches a client's emails without an authenticated session.
 *
 * ## What Breaks If These Fail
 * AC-1 failing is FE-2824 returning: a request that fires, but addressed by
 * whoever is logged in rather than by the scope that was opened. AC-10 failing
 * means an unauthenticated caller reaches a client's email resource at all.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useActiveSession, useSessionStore } from "../../session-store";
import { createClientEmailServices } from "../client-email.services";
import {
  assertClientIdentityTransport,
  clientEmailScopeKeys,
  installEmailsListHandler,
  installPagedEmailsHandler,
  logoutClientSession,
  observeEmailRequests,
  recorded,
  recordedRows,
  resolveClientIdOnActiveSession,
  seedAuthenticatedSessionWithoutClientId,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";
import { NotAuthenticatedError } from "../../../utils";
import type { ObservedRequest } from "./client-email.int-helpers";

// -----------------------------------------------------------------------------

describe("client-email collection — read and state", () => {
  it("AC-1 lists my own addresses from the scope-resolved client's own resource, with my token and no acting-as headers", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const observed = observeEmailRequests();

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(
        recorded.list().data.length
      )
    );
    observed.stop();

    assertClientIdentityTransport(observed.first(), clientId, accessToken);
    expect(observed.first().method).toBe("GET");
    expect(emails.useContext().data.value.map(email => email.email)).toEqual(
      recorded.list().data.map(row => row.email)
    );
  });

  it("AC-1 never loads another client's addresses — every request this scope emits names its own client id", async () => {
    const { clientId } = await seedClientSession();
    const observed = observeEmailRequests();

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(emails.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    const foreign = observed
      .all()
      .filter(request => !request.url.includes(`/clients/${clientId}/`));
    expect(foreign.map(request => request.url)).toEqual([]);
  });

  it("AC-3 reports loading, empty and errored state, and its readiness is awaitable", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary, secondary]);

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    const meta = emails.useMeta();

    await expect(emails.useActions().isReady()).resolves.toBe(true);
    expect(meta.isLoading.value).toBe(false);
    expect(meta.isEmpty.value).toBe(false);
    expect(meta.hasError.value).toBe(false);
    expect(emails.useContext().data.value).toHaveLength(2);
  });

  it("AC-3 reports an empty collection as empty", async () => {
    const { clientId } = await seedClientSession();
    installEmailsListHandler(server, clientId, []);

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();

    await vi.waitFor(() => expect(emails.useMeta().isEmpty.value).toBe(true));
    expect(emails.useContext().data.value).toEqual([]);
  });
});

describe("client-email collection — list controls (AC-8)", () => {
  it("AC-8 refresh() re-issues the list request", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    const list = installEmailsListHandler(server, clientId, [primary]);

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();
    const before = list.reads();

    await emails.useActions().refresh();

    await vi.waitFor(() => expect(list.reads()).toBeGreaterThan(before));
  });

  it("AC-8 invalidate() makes the next read fetch the list again", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    const list = installEmailsListHandler(server, clientId, [primary]);

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();

    list.setRows([primary, secondary]);
    await emails.useActions().invalidate();

    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(2)
    );
  });

  it("AC-8 filters.query() re-issues the list request carrying the filter term", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary]);

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();

    const observed = observeEmailRequests();
    await emails.useActions().filters.query("a@b");

    await vi.waitFor(() => {
      expect(
        observed.all().some(request => request.url.includes("a%40b"))
      ).toBe(true);
    });
    observed.stop();
  });

  it("AC-8 fetches ALL my addresses by default — limit=0, offset=0, one page holding the collection", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary, secondary]);

    const observed = observeEmailRequests();
    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();
    observed.stop();

    const listed = new URL(observed.first().url);
    expect(listed.searchParams.get("limit")).toBe("0");
    expect(listed.searchParams.get("offset")).toBe("0");
    expect(emails.useContext().pagination.value).toMatchObject({
      limit: 0,
      page: 1,
      pages: 1
    });
    expect(emails.useContext().data.value).toHaveLength(2);
  });

  it("AC-8 has no other page to go to by default — nextPage()/prevPage() reach the wire not at all and say so", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    const list = installEmailsListHandler(server, clientId, [
      primary,
      secondary
    ]);

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();

    const readsBeforePaging = list.reads();
    const observed = observeEmailRequests();

    await expect(
      Promise.resolve().then(() => emails.useActions().nextPage())
    ).rejects.toThrow(/page_next_not_available/);
    await expect(
      Promise.resolve().then(() => emails.useActions().prevPage())
    ).rejects.toThrow(/page_previous_not_available/);

    // Give a (wrongly) advanced cursor time to refetch before asserting silence.
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
    expect(list.reads()).toBe(readsBeforePaging);
    expect(emails.useContext().pagination.value.page).toBe(1);
  });

  it("AC-8 pages when a caller asks for it — loadList({ pagination: { limit: 2 } }) walks limit=2&offset=0 to limit=2&offset=2 and back", async () => {
    const { clientId } = await seedClientSession();
    const paged = installPagedEmailsHandler(server, clientId);

    const observed = observeEmailRequests();
    const query = createClientEmailServices(ScopeActorTypes.CLIENT).loadList({
      pagination: { limit: 2 }
    });

    await vi.waitFor(() => expect(query.data.value).toHaveLength(2));

    const firstRequest = new URL(observed.all()[0].url);
    expect(firstRequest.searchParams.get("limit")).toBe("2");
    expect(firstRequest.searchParams.get("offset")).toBe("0");
    expect(query.pagination.value).toMatchObject({ limit: 2, page: 1 });

    query.fetchNextPage();

    await vi.waitFor(() => expect(query.pagination.value.page).toBe(2));
    await vi.waitFor(() =>
      expect(observed.matching("offset=2").length).toBeGreaterThan(0)
    );
    const secondRequest = new URL(observed.matching("offset=2")[0].url);
    expect(secondRequest.searchParams.get("limit")).toBe("2");
    expect(secondRequest.searchParams.get("offset")).toBe("2");
    await vi.waitFor(() => expect(query.data.value).toHaveLength(1));

    query.fetchPreviousPage();

    await vi.waitFor(() => expect(query.pagination.value.page).toBe(1));
    await vi.waitFor(() => expect(query.data.value).toHaveLength(2));
    observed.stop();

    // Page one is served from cache on the way back, so the walk's WIRE
    // evidence is the two offsets it asked for and no third.
    expect(paged.offsets()).toEqual(["0", "2"]);
  });
});

describe("client-email collection — lifecycle (AC-9)", () => {
  it("AC-9 destroy() releases the scope entry and the next open mints a fresh collection", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary]);

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();
    const firstQuery = emails.useInternals().query;
    expect(clientEmailScopeKeys().length).toBeGreaterThan(0);

    emails.useActions().destroy();

    expect(clientEmailScopeKeys()).toEqual([]);

    const reopened = useClientEmails().as(ScopeActorTypes.SELF);
    expect(reopened.useInternals().query).not.toBe(firstQuery);
  });
});

describe("client-email collection — the session is dropped mid-use (AC-10)", () => {
  it("AC-10 stops touching a client's email resource the moment the session goes away", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary]);

    const opened = useClientEmails().as(ScopeActorTypes.SELF);
    await opened.useActions().isReady();

    await logoutClientSession();

    const observed = observeEmailRequests();
    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    // Give an (incorrectly) enabled query time to fire before asserting absence.
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
    await expect(emails.useActions().remove(primary.id)).rejects.toBeInstanceOf(
      NotAuthenticatedError
    );
  });
});

describe("client-email collection — addressability (AC-3)", () => {
  afterEach(async () => {
    await logoutClientSession();
  });

  it("AC-3 reports the collection available once the client session is active", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary]);

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();

    expect(emails.useMeta().isAvailable.value).toBe(true);
  });

  it("AC-3 reports the collection unavailable when the session authenticates but resolves no client id", async () => {
    await seedAuthenticatedSessionWithoutClientId();

    const meta = useClientEmails().as(ScopeActorTypes.SELF).useMeta();

    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
    expect(meta.isAvailable.value).toBe(false);
  });

  it("AC-3 emits nothing while the client id is unresolved, then flips available and addresses the list at the resolved client (AC-1)", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observeEmailRequests();

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    const meta = emails.useMeta();
    expect(meta.isAvailable.value).toBe(false);

    // Give a query enabled on the session alone — authenticated, id still
    // missing — time to fire at `clients/undefined/emails` before asserting
    // the wire stayed silent.
    await new Promise(resolve => setTimeout(resolve, 250));
    expect(observed.all().map(request => request.url)).toEqual([]);

    const { clientId } = await resolveClientIdOnActiveSession();

    // This collection's own read is the limit=0 one (AC-8's default page) —
    // other live queries in the file share the observer's `/emails` filter.
    const listReads = (): ObservedRequest[] =>
      observed
        .all()
        .filter(
          request => new URL(request.url).searchParams.get("limit") === "0"
        );

    await vi.waitFor(() => expect(listReads().length).toBeGreaterThan(0));
    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(
        recorded.list().data.length
      )
    );
    observed.stop();

    expect(meta.isAvailable.value).toBe(true);
    expect(new URL(listReads()[0].url).pathname).toContain(
      `/clients/${clientId}/emails`
    );
    expect(
      observed
        .all()
        .filter(request =>
          /\/clients\/(undefined|null)?\/emails/.test(request.url)
        )
        .map(request => request.url)
    ).toEqual([]);
  });

  it("AC-3 flips the collection to unavailable in the same tick the session goes away, emitting no request", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary]);

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();
    expect(emails.useMeta().isAvailable.value).toBe(true);

    const observed = observeEmailRequests();
    useSessionStore().useActions().logout();
    await vi.waitFor(() =>
      expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false)
    );

    // Read in the tick the guard's OWN predicate closed in — nothing is
    // awaited between the guard flipping and the flag being read, so a flag
    // that lags the gate by even one settle fails here.
    expect(emails.useMeta().isAvailable.value).toBe(false);

    // Give a (wrongly) re-enabled query time to fire before asserting silence.
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
  });
});
