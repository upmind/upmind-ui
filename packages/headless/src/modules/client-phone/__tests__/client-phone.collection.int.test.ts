// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone collection — read, state, controls, lifecycle
 *
 * ## Job To Be Done
 * Drive the REAL `useClientPhones().as('self')` through the barrel against
 * MSW-replayed staging recordings and prove:
 * AC-1 the list request is addressed to the SCOPE-RESOLVED client's own
 *      resource, with that client session's token and no acting-as headers;
 * AC-2 each row carries its status/display fields independently;
 * AC-3/AC-4 the collection's state is readable and its readiness awaitable
 *      without the consumer ever inspecting the session;
 * AC-5/AC-6 the default and by-id/by-mapping lookups;
 * AC-10 refresh/invalidate reach the wire (or refuse to, when unaddressable);
 * AC-11/AC-12 paging and free-text filtering;
 * AC-13 find-or-create (`ensure`) — the cross-module seam client-company and
 *       basket-billing/unified depend on;
 * AC-14 destroying the collection releases its scope entry.
 *
 * ## What Breaks If These Fail
 * AC-1 failing is FE-2824 returning: a request that fires, but addressed by
 * whoever is logged in rather than by the scope that was opened.
 */

import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useClientPhones } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useActiveSession } from "../../session-store";
import { createClientPhoneServices } from "../client-phone.services";
import {
  assertClientIdentityTransport,
  clientPhoneScopeKeys,
  installPagedPhonesHandler,
  installPhonesListHandler,
  logoutClientSession,
  observePhoneRequests,
  recorded,
  recordedRows,
  resolveClientIdOnActiveSession,
  seedAuthenticatedSessionWithoutClientId,
  seedClientSession
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";
import { NotAuthenticatedError } from "../../../utils";
import type { WirePhone } from "./client-phone.int-helpers";

// -----------------------------------------------------------------------------

describe("client-phone collection — read and state (AC-1, AC-2)", () => {
  it("AC-1 lists my own numbers from the scope-resolved client's own resource, with my token and no acting-as headers", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const observed = observePhoneRequests();

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    assertClientIdentityTransport(observed.first(), clientId, accessToken);
    expect(observed.first().method).toBe("GET");
    expect(phones.useContext().data.value.map(phone => phone.id)).toEqual(
      recorded.list().data.map(row => row.id)
    );
  });

  it("AC-1 never loads another client's numbers — every request this scope emits names its own client id", async () => {
    const { clientId } = await seedClientSession();
    const observed = observePhoneRequests();

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    const foreign = observed
      .all()
      .filter(request => !request.url.includes(`/clients/${clientId}/`));
    expect(foreign.map(request => request.url)).toEqual([]);
  });

  it("AC-2 asserts the default/non-deletable/unverified meta triple independently per row", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    const nonDeletable: WirePhone = {
      ...secondary,
      id: "row-non-deletable",
      can_delete: false
    };
    installPhonesListHandler(server, clientId, [
      primary,
      secondary,
      nonDeletable
    ]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(3)
    );

    const rows = phones.useContext().data.value;
    expect(rows.find(row => row.id === primary.id)?.meta).toEqual({
      isDefault: true,
      isVerified: Boolean(primary.verified),
      canDelete: Boolean(primary.can_delete)
    });
    expect(rows.find(row => row.id === secondary.id)?.meta.isVerified).toBe(
      Boolean(secondary.verified)
    );
    expect(
      rows.find(row => row.id === "row-non-deletable")?.meta.canDelete
    ).toBe(false);
  });
});

describe("client-phone collection — state and readiness (AC-3, AC-4)", () => {
  it("AC-3 reports loading, empty and errored state, and its readiness is awaitable", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installPhonesListHandler(server, clientId, [primary, secondary]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    const meta = phones.useMeta();

    await expect(phones.useActions().isReady()).resolves.toBe(true);
    expect(meta.isLoading.value).toBe(false);
    expect(meta.isEmpty.value).toBe(false);
    expect(meta.hasError.value).toBe(false);
    expect(phones.useContext().data.value).toHaveLength(2);
  });

  it("AC-3 reports an empty collection as empty", async () => {
    const { clientId } = await seedClientSession();
    installPhonesListHandler(server, clientId, []);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await phones.useActions().isReady();

    await vi.waitFor(() => expect(phones.useMeta().isEmpty.value).toBe(true));
    expect(phones.useContext().data.value).toEqual([]);
  });

  it("AC-4 resolves isReady() false, with no request, when the session settles with no addressable client", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observePhoneRequests();

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    const settled = await Promise.race([
      phones.useActions().isReady(),
      new Promise(resolve => setTimeout(() => resolve("never-settled"), 3000))
    ]);
    observed.stop();

    expect(settled).toBe(false);
    expect(observed.all().map(request => request.url)).toEqual([]);
  });
});

describe("client-phone collection — addressability (AC-3)", () => {
  afterEach(async () => {
    await logoutClientSession();
  });

  it("AC-3 reports the collection available once the client session is active", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    installPhonesListHandler(server, clientId, [primary]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await phones.useActions().isReady();

    expect(phones.useMeta().isAvailable.value).toBe(true);
  });

  it("AC-3 reports the collection unavailable when the session authenticates but resolves no client id", async () => {
    await seedAuthenticatedSessionWithoutClientId();

    const meta = useClientPhones().as(ScopeActorTypes.SELF).useMeta();

    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
    expect(meta.isAvailable.value).toBe(false);
  });

  it("AC-3 emits nothing while the client id is unresolved, then flips available and addresses the list at the resolved client (AC-1)", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observePhoneRequests();

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    const meta = phones.useMeta();
    expect(meta.isAvailable.value).toBe(false);

    // Give a query enabled on the session alone — authenticated, id still
    // missing — time to fire at `clients/undefined/phones` before asserting
    // the wire stayed silent.
    await new Promise(resolve => setTimeout(resolve, 250));
    expect(observed.all().map(request => request.url)).toEqual([]);

    const { clientId } = await resolveClientIdOnActiveSession();

    await vi.waitFor(() => expect(meta.isAvailable.value).toBe(true));
    await vi.waitFor(() =>
      expect(phones.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    const addressed = observed
      .all()
      .filter(request => request.url.includes(`/clients/${clientId}/phones`));
    expect(addressed.length).toBeGreaterThan(0);
    expect(
      observed
        .all()
        .filter(request =>
          /\/clients\/(undefined|null)?\/phones/.test(request.url)
        )
        .map(request => request.url)
    ).toEqual([]);
  });
});

describe("client-phone collection — default and lookups (AC-5, AC-6)", () => {
  it("AC-5 reads the default phone, and undefined when none is default", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installPhonesListHandler(server, clientId, [
      { ...primary, default: false },
      { ...secondary, default: true }
    ]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(2)
    );

    expect(phones.useContext().default()?.id).toBe(secondary.id);
  });

  it("AC-5 tells me I have no default when none of my numbers is one", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installPhonesListHandler(server, clientId, [
      { ...primary, default: false },
      { ...secondary, default: false }
    ]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(2)
    );

    expect(phones.useContext().default()).toBeUndefined();
  });

  it("AC-6 looks a number up by id — a hit and a miss, with no outbound request for either", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installPhonesListHandler(server, clientId, [primary, secondary]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(2)
    );

    const observed = observePhoneRequests();
    expect(phones.useContext().getOne(secondary.id)?.id).toBe(secondary.id);
    expect(phones.useContext().getOne("does-not-exist")).toBeUndefined();
    observed.stop();

    expect(observed.all()).toEqual([]);
  });

  it("AC-6 finds a number by its parsed number, with no outbound request", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installPhonesListHandler(server, clientId, [primary, secondary]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(2)
    );

    const target = phones.useContext().getOne(secondary.id)!;
    const observed = observePhoneRequests();
    const found = phones
      .useContext()
      .findOne({ phone: { number: target.phone.number } });
    observed.stop();

    expect(found?.id).toBe(secondary.id);
    expect(observed.all()).toEqual([]);
  });
});

describe("client-phone collection — list controls (AC-10, AC-11, AC-12)", () => {
  it("AC-10 refresh() re-issues the list request", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    const list = installPhonesListHandler(server, clientId, [primary]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await phones.useActions().isReady();
    const before = list.reads();

    await phones.useActions().refresh();

    await vi.waitFor(() => expect(list.reads()).toBeGreaterThan(before));
  });

  it("AC-10 refresh() rejects with NotAuthenticatedError and fires no request when unaddressable", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observePhoneRequests();

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await expect(phones.useActions().refresh()).rejects.toBeInstanceOf(
      NotAuthenticatedError
    );
    observed.stop();

    expect(observed.all().map(request => request.url)).toEqual([]);
  });

  it("AC-10 invalidate() makes the next read fetch the list again", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    const list = installPhonesListHandler(server, clientId, [primary]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await phones.useActions().isReady();

    list.setRows([primary, secondary]);
    await phones.useActions().invalidate();

    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(2)
    );
  });

  it("AC-11 pages through the collection — loadList({pagination:{limit:2}}) walks limit=2&offset=0 to limit=2&offset=2 and back", async () => {
    const { clientId } = await seedClientSession();
    const paged = installPagedPhonesHandler(server, clientId);

    const observed = observePhoneRequests();
    const query = createClientPhoneServices(ScopeActorTypes.CLIENT).loadList();
    query.setCriteria({ pagination: { limit: 2 } });

    await vi.waitFor(() => expect(query.data.value).toHaveLength(2));

    const firstRequest = new URL(observed.all()[0].url);
    expect(firstRequest.searchParams.get("limit")).toBe("2");
    expect(firstRequest.searchParams.get("offset")).toBe("0");
    expect(query.pagination.value.total).toBe(recorded.pageOne().total);

    query.fetchNextPage();

    await vi.waitFor(() =>
      expect(observed.matching("offset=2").length).toBeGreaterThan(0)
    );
    const secondRequest = new URL(observed.matching("offset=2")[0].url);
    expect(secondRequest.searchParams.get("limit")).toBe("2");
    expect(secondRequest.searchParams.get("offset")).toBe("2");
    observed.stop();

    expect(paged.offsets()).toEqual(["0", "2"]);
  });

  it("AC-12 filterBy() re-issues the list request carrying the filter term, without re-firing the unfiltered read", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    installPhonesListHandler(server, clientId, [primary]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await phones.useActions().isReady();

    const observed = observePhoneRequests();
    phones.useActions().filterBy({ number: { like: "7911" } });

    await vi.waitFor(() => {
      expect(observed.all().some(request => request.url.includes("7911"))).toBe(
        true
      );
    });
    observed.stop();

    expect(observed.all()).toHaveLength(1);
  });
});

describe("client-phone collection — find-or-create (AC-13)", () => {
  it("AC-13 adding a number I already have returns that number and creates nothing", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installPhonesListHandler(server, clientId, [primary, secondary]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(2)
    );
    const target = phones.useContext().getOne(secondary.id)!;

    let posted = false;
    server?.use(
      http.post(`*/clients/${clientId}/phones`, () => {
        posted = true;
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const result = await phones.useActions().ensure({
      phone: {
        number: target.phone.number,
        nationalNumber: target.phone.nationalNumber,
        countryCallingCode: target.phone.countryCallingCode,
        country: target.phone.country
      }
    });

    expect(posted).toBe(false);
    expect(result.id).toBe(secondary.id);
  });

  it("AC-13 adding a number I do not hold POSTs to my own collection and returns the created number", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { primary } = recordedRows();
    installPhonesListHandler(server, clientId, [primary]);
    const created = recorded.created().data;

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(1)
    );

    const captured: { url?: string; headers?: Record<string, string> } = {};
    server?.use(
      http.post(`*/clients/${clientId}/phones`, ({ request }) => {
        captured.url = request.url;
        captured.headers = Object.fromEntries(request.headers.entries());
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const result = await phones.useActions().ensure({
      phone: {
        number: null,
        nationalNumber: created.phone,
        countryCallingCode: "44",
        country: created.phone_country_code
      }
    });

    expect(captured.url).toContain(`/clients/${clientId}/phones`);
    expect(
      captured.headers?.authorization ?? captured.headers?.Authorization
    ).toBe(`Bearer ${accessToken}`);
    expect(result.id).toBe(created.id);
  });
});

describe("client-phone collection — lifecycle (AC-14)", () => {
  it("AC-14 destroy() releases the scope entry and the next open mints a fresh collection", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    installPhonesListHandler(server, clientId, [primary]);

    const phones = useClientPhones().as(ScopeActorTypes.SELF);
    await phones.useActions().isReady();
    const firstQuery = phones.useInternals().query;
    const keysBefore = clientPhoneScopeKeys().length;
    expect(keysBefore).toBeGreaterThan(0);

    phones.useActions().destroy();

    expect(clientPhoneScopeKeys().length).toBe(keysBefore - 1);

    const reopened = useClientPhones().as(ScopeActorTypes.SELF);
    expect(reopened.useInternals().query).not.toBe(firstQuery);
  });
});
