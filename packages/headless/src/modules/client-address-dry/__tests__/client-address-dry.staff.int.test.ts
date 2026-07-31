/**
 * @fileoverview client-address-dry — staff
 * (`.as('staff').for('client', id)`) integration — real collection + MSW
 * replay
 *
 * ## Job To Be Done
 * Drive the REAL `useClientAddressesDry().as('staff').for('client', TARGET)`
 * collection over a seeded multi-session (client ACTIVE, staff cached) store
 * against the address endpoints (`docs/sdd/client-address-dry-smoke/design.md`
 * §3.1, AC-B1/B2/B3/B4; `parity.yaml` cell 2) — the A7 proof this smoke
 * test's headline turns on: the outbound request must retarget to
 * `admin/clients/{TARGET}/addresses` (never the session client's own
 * `clients/{sessionClientId}/addresses`) AND carry the STAFF session's token
 * (never the active/client token), for both the list read and every
 * mutation, exactly as legacy vue-app's admin path does
 * (`vue-app/.../clients/addresses.ts:17,20`) — never as the `client-email`
 * pilot cosplayed it (scope shape present, `.for()` target silently
 * dropped, FE-2824).
 *
 * ## What Breaks If These Fail
 * A staff member `.for('client', id)` reads or mutates the ACTIVE session's
 * own client instead of the named target (data leak / wrong-account
 * mutation) — the exact FE-2824 archetype this module exists to not repeat.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { AccessRoleTypes } from "@upmind-automation/types";
// `session-store` MUST load before the `..` barrel below — see
// `client-address-dry.client.int.test.ts`'s identical note.
// eslint-disable-next-line import/order
import {
  useSessionStore,
  useActiveSession,
  mapSessionUser
} from "../../session-store";
import { useClientAddressesDry } from "..";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { ScopeActorTypes } from "../../scope";
import { server } from "./setup.integration";
import type { ISelf, IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const sessionStoreRecordingsDir = join(
  import.meta.dirname,
  "../../session-store/__tests__/fixtures"
);
const recordingsDir = join(import.meta.dirname, "fixtures");

type SelfResponse = { data: ISelf };

interface AddressRecord {
  id: string;
  import_id: string | null;
  staged_import: boolean;
  external_id: string | null;
  client_id: string;
  user_id: string;
  type: number;
  default: boolean;
  verified: number;
  name: string;
  address_1: string;
  address_2: string;
  region_id: string | null;
  country_id: string;
  city: string;
  postcode: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  can_delete: boolean;
}

interface AddressesEnvelope<T> {
  status: string;
  data: T;
  related: unknown;
  total: number | null;
  error: unknown;
  messages: unknown[];
  meta: unknown;
}

const SESSION_CLIENT_ID = "mock-uuid-1";
const TARGET_CLIENT_ID = "target-client-9";

/**
 * Seeds a client session as ACTIVE plus a staff session cached alongside it
 * (never activated) — mirrors `client-phone-dry.staff.int.test.ts`'s
 * `seedClientAndStaffSessions` (itself mirroring `session-store.int.test.ts`
 * SS-I5/SS-I6's "derived token" convention for a second actor). The active
 * session staying CLIENT is the point: it proves the staff arm selects the
 * staff token explicitly rather than falling through to `withAccessToken:
 * true`'s active-session default (design.md §3.1).
 */
async function seedClientAndStaffSessions(
  functionalityCodes: string[] = [
    "list_client_addresses",
    "create_client_address",
    "update_client_address",
    "delete_client_address"
  ]
): Promise<{ staffToken: IToken }> {
  const clientToken = getFixtureBody<IToken>("post-oauth-access-token-client", {
    recordingsDir: sessionStoreRecordingsDir
  });
  const selfResponse = getFixtureBody<SelfResponse>("get-self", {
    recordingsDir: sessionStoreRecordingsDir
  });

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(clientToken, true, mapSessionUser(selfResponse.data));

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });

  const staffToken: IToken = {
    ...clientToken,
    actor_type: AccessRoleTypes.STAFF,
    actor_id: `${clientToken.actor_id}-staff`,
    access_token: `${clientToken.access_token}-staff`
  };
  const staffSelf: SelfResponse = {
    data: {
      ...selfResponse.data,
      actor: {
        ...selfResponse.data.actor,
        id: staffToken.actor_id as string,
        email: "staff-1@example.com"
      }
    }
  };
  const staffUser = {
    ...mapSessionUser(staffSelf.data),
    functionalities: functionalityCodes.map(code => ({ code }))
  };

  await useSessionStore().useActions().add(staffToken, false, staffUser);

  await vi.waitFor(() => {
    const { allSessions } = useSessionStore().useContext();
    expect(allSessions.value[staffToken.actor_id as string]).toBeDefined();
  });

  // The active session stays CLIENT — the A7 proof.
  expect(useSessionStore().useContext().activeActor.value).toBe(
    AccessRoleTypes.CLIENT
  );

  return { staffToken };
}

// --- recorded fixtures (admin path, captured live against staging) —
// journey bodies MUST come from here, never a locally manufactured builder
// (`scope-based/no-hand-rolled-int-fixture`).

const listBody = getFixtureBody<AddressesEnvelope<AddressRecord[]>>(
  "get-admin-clients-id-addresses-with-staged-imports-1",
  { recordingsDir }
);
const createBody = getFixtureBody<AddressesEnvelope<AddressRecord>>(
  "post-admin-clients-id-addresses",
  { recordingsDir }
);
const updateBody = getFixtureBody<AddressesEnvelope<AddressRecord>>(
  "put-admin-clients-id-addresses-id",
  { recordingsDir }
);
const deleteBody = getFixtureBody<AddressesEnvelope<null>>(
  "delete-admin-clients-id-addresses-id",
  { recordingsDir }
);

const FIRST_ADDRESS_ID = listBody.data[0].id;

/**
 * The AC-B5 read-back shape (`canList`/`canCreate`/`canUpdate`/`canDelete`)
 * — declared locally (never imported from the module's own implementation
 * files) so this test asserts the public runtime shape, not a type this
 * seat is withheld from reading.
 */
interface StaffMetaCapabilities {
  canList?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

/** Reshapes the recorded list envelope to a single row — not a fabricated body. */
function oneRow(record: AddressRecord): AddressesEnvelope<AddressRecord[]> {
  return { ...listBody, data: [record], total: 1 };
}

// -----------------------------------------------------------------------------

describe("client-address-dry — staff (.as('staff').for('client', id))", () => {
  beforeEach(() => {
    clearSessionCookies();
    sessionStorage.clear();
    useClientAddressesDry().as(ScopeActorTypes.CLIENT).useActions().destroy();
    useClientAddressesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID)
      .useActions()
      .destroy();
  });

  it("AC-B1 (HEADLINE, A7): the list request retargets to admin/clients/{TARGET}/addresses with the staff token", async () => {
    const { staffToken } = await seedClientAndStaffSessions();

    const seenRequests: { url: string; auth: string | null }[] = [];
    server?.use(
      http.get("*/clients/*/addresses", ({ request }) => {
        seenRequests.push({
          url: request.url,
          auth: request.headers.get("Authorization")
        });
        return HttpResponse.json(oneRow(listBody.data[0]), { status: 200 });
      })
    );

    const addresses = useClientAddressesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await addresses
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBe(1)
    );

    expect(seenRequests.length).toBeGreaterThan(0);
    const [seen] = seenRequests;

    // URL retarget: admin path, keyed on the TARGET, never the session client.
    expect(seen.url).toContain(`admin/clients/${TARGET_CLIENT_ID}/addresses`);
    expect(seen.url).not.toContain(`clients/${SESSION_CLIENT_ID}/addresses`);

    // Auth identity transport: the STAFF token, exactly — never the
    // active/client token (exact-match, not substring: the derived staff
    // token is `${clientToken.access_token}-staff`, so a substring check
    // would trivially "pass" even against the client token).
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir: sessionStoreRecordingsDir }
    );
    expect(seen.auth).toBe(`Bearer ${staffToken.access_token}`);
    expect(seen.auth).not.toBe(`Bearer ${clientToken.access_token}`);
  });

  it("AC-B2: add/update/remove/setDefault retarget to admin/clients/{TARGET}/addresses[/{id}] with the staff token", async () => {
    const { staffToken } = await seedClientAndStaffSessions();
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir: sessionStoreRecordingsDir }
    );

    server?.use(
      http.get("*/clients/*/addresses", () =>
        HttpResponse.json(oneRow(listBody.data[0]), { status: 200 })
      )
    );

    const mutations: { method: string; url: string; auth: string | null }[] =
      [];
    server?.use(
      http.post("*/clients/*/addresses", ({ request }) => {
        mutations.push({
          method: "POST",
          url: request.url,
          auth: request.headers.get("Authorization")
        });
        return HttpResponse.json(createBody, { status: 200 });
      }),
      http.put("*/clients/*/addresses/*", ({ request }) => {
        mutations.push({
          method: "PUT",
          url: request.url,
          auth: request.headers.get("Authorization")
        });
        return HttpResponse.json(updateBody, { status: 200 });
      }),
      http.delete("*/clients/*/addresses/*", ({ request }) => {
        mutations.push({
          method: "DELETE",
          url: request.url,
          auth: request.headers.get("Authorization")
        });
        return HttpResponse.json(deleteBody, { status: 200 });
      })
    );

    const addresses = useClientAddressesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await addresses
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBe(1)
    );

    await addresses.useActions().add?.({
      type: 1,
      address: {
        address1: "1 Test Street",
        city: "Testville",
        postcode: "TE5 7ST",
        countryId: "country-1"
      }
    });
    addresses.useActions().update?.(FIRST_ADDRESS_ID, {
      type: 2,
      address: {
        address1: "2 Test Street",
        city: "Testville",
        postcode: "TE5 7ST",
        countryId: "country-1"
      }
    });
    addresses.useActions().remove?.(FIRST_ADDRESS_ID);

    await vi.waitFor(() => expect(mutations.length).toBeGreaterThanOrEqual(2));

    for (const mutation of mutations) {
      expect(mutation.url).toContain(
        `admin/clients/${TARGET_CLIENT_ID}/addresses`
      );
      expect(mutation.url).not.toContain(
        `clients/${SESSION_CLIENT_ID}/addresses`
      );
      // Exact-match, both directions — on every mutation, not just the list.
      expect(mutation.auth).toBe(`Bearer ${staffToken.access_token}`);
      expect(mutation.auth).not.toBe(`Bearer ${clientToken.access_token}`);
    }
  });

  it("AC-B3: remove is undefined for a staff session lacking delete_client_address, and a function once granted", async () => {
    server?.use(
      http.get("*/clients/*/addresses", () =>
        HttpResponse.json(oneRow(listBody.data[0]), { status: 200 })
      )
    );

    await seedClientAndStaffSessions([
      "list_client_addresses",
      "create_client_address",
      "update_client_address"
    ]);
    const denied = useClientAddressesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await denied
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(denied.useContext().data.value.length).toBe(1)
    );
    expect(typeof denied.useActions().remove).toBe("undefined");

    denied.useActions().destroy();
    clearSessionCookies();
    sessionStorage.clear();

    await seedClientAndStaffSessions([
      "list_client_addresses",
      "create_client_address",
      "update_client_address",
      "delete_client_address"
    ]);
    const granted = useClientAddressesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await granted
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(granted.useContext().data.value.length).toBe(1)
    );
    expect(typeof granted.useActions().remove).toBe("function");
  });

  it("AC-B4 (ensure create-gate): add and ensure are undefined for a staff session lacking create_client_address, and functions once granted", async () => {
    server?.use(
      http.get("*/clients/*/addresses", () =>
        HttpResponse.json(oneRow(listBody.data[0]), { status: 200 })
      )
    );

    await seedClientAndStaffSessions([
      "list_client_addresses",
      "update_client_address",
      "delete_client_address"
    ]);
    const denied = useClientAddressesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await denied
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(denied.useContext().data.value.length).toBe(1)
    );
    expect(typeof denied.useActions().add).toBe("undefined");
    expect(typeof denied.useActions().ensure).toBe("undefined");

    denied.useActions().destroy();
    clearSessionCookies();
    sessionStorage.clear();

    await seedClientAndStaffSessions([
      "list_client_addresses",
      "create_client_address",
      "update_client_address",
      "delete_client_address"
    ]);
    const granted = useClientAddressesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await granted
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(granted.useContext().data.value.length).toBe(1)
    );
    expect(typeof granted.useActions().add).toBe("function");
    expect(typeof granted.useActions().ensure).toBe("function");
  });

  it("AC-B5: the four staff capability flags are exposed as readable meta, and the same source gates the actions arm", async () => {
    server?.use(
      http.get("*/clients/*/addresses", () =>
        HttpResponse.json(oneRow(listBody.data[0]), { status: 200 })
      )
    );

    // Arrange 1: all four capabilities granted.
    await seedClientAndStaffSessions([
      "list_client_addresses",
      "create_client_address",
      "update_client_address",
      "delete_client_address"
    ]);
    const allGranted = useClientAddressesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await allGranted
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(allGranted.useContext().data.value.length).toBe(1)
    );

    const grantedMeta =
      allGranted.useMeta() as unknown as StaffMetaCapabilities;
    expect(grantedMeta.canList).toBe(true);
    expect(grantedMeta.canCreate).toBe(true);
    expect(grantedMeta.canUpdate).toBe(true);
    expect(grantedMeta.canDelete).toBe(true);

    allGranted.useActions().destroy();
    clearSessionCookies();
    sessionStorage.clear();

    // Arrange 2: delete revoked only — each flag must be independently
    // sourced (not a blanket toggle), and the SAME capability source must
    // gate the actions arm (single source of truth, D-ADDR-5).
    await seedClientAndStaffSessions([
      "list_client_addresses",
      "create_client_address",
      "update_client_address"
    ]);
    const deleteRevoked = useClientAddressesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await deleteRevoked
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(deleteRevoked.useContext().data.value.length).toBe(1)
    );

    const revokedMeta =
      deleteRevoked.useMeta() as unknown as StaffMetaCapabilities;
    expect(revokedMeta.canDelete).toBe(false);
    expect(revokedMeta.canList).toBe(true);
    expect(revokedMeta.canCreate).toBe(true);
    expect(revokedMeta.canUpdate).toBe(true);

    // Single source of truth: the same revoked capability leaves `remove`
    // undefined on the actions arm — meta and actions must agree.
    expect(typeof deleteRevoked.useActions().remove).toBe("undefined");
  });

  it("AC-STAGED (shared, staff arm): the retargeted list also carries with_staged_imports=1", async () => {
    await seedClientAndStaffSessions();

    const seenQueries: string[] = [];
    server?.use(
      http.get("*/clients/*/addresses", ({ request }) => {
        seenQueries.push(new URL(request.url).search);
        return HttpResponse.json(
          oneRow({ ...listBody.data[0], id: "staged-1", staged_import: true }),
          { status: 200 }
        );
      })
    );

    const addresses = useClientAddressesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await addresses
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBe(1)
    );

    expect(seenQueries.some(q => q.includes("with_staged_imports=1"))).toBe(
      true
    );
    expect(addresses.useContext().data.value[0].id).toBe("staged-1");
  });
});
