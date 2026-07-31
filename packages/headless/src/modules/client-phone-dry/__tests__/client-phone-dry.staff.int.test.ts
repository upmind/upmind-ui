/**
 * @fileoverview client-phone-dry — staff (`.as('staff').for('client', id)`)
 * integration — real collection + MSW replay
 *
 * ## Job To Be Done
 * Drive the REAL `useClientPhonesDry().as('staff').for('client', TARGET)`
 * collection over a seeded multi-session (client ACTIVE, staff cached) store
 * against the phones endpoints (`docs/sdd/client-phone-dry-smoke/design.md`
 * §3, AC-B1/B2/B3; `parity.yaml` cell B) — the A7 proof this smoke test's
 * headline turns on: the outbound request must retarget to
 * `admin/clients/{TARGET}/phones` (never the session client's own
 * `clients/{sessionClientId}/phones`) AND carry the STAFF session's token
 * (never the active/client token), for both the list read and every
 * mutation, exactly as legacy vue-app's admin path does
 * (`vue-app/.../clients/phones.ts:14-32`) — never as the `client-email`
 * pilot cosplayed it (scope shape present, `.for()` target silently
 * dropped, ADR-001:440).
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
// `session-store` MUST load before the `..` barrel below — a pre-existing,
// load-order-sensitive circular dependency between `scope` and `client-email`
// (unrelated to client-phone-dry, reproduces for any module's isolated
// integration file; see test-report.md) throws on a cold module graph
// otherwise.
// eslint-disable-next-line import/order
import {
  useSessionStore,
  useActiveSession,
  mapSessionUser
} from "../../session-store";
import { useClientPhonesDry } from "..";
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

interface PhoneRecord {
  id: string;
  import_id: string | null;
  staged_import: boolean;
  external_id: string | null;
  client_id: string;
  user_id: string;
  type: number;
  default: boolean;
  verified: number;
  syntax_valid: boolean;
  phone: string;
  phone_code: string;
  international_phone: string;
  phone_country_code: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  full_phone: string;
  can_delete: boolean;
}

interface PhonesEnvelope<T> {
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
 * (never activated) — mirrors `session-store.int.test.ts` SS-I5/SS-I6's own
 * "derived token" convention for a second actor. The active session staying
 * CLIENT is the point: it proves the staff arm selects the staff token
 * explicitly rather than falling through to `withAccessToken: true`'s
 * active-session default (design.md §3.2).
 *
 * `functionalityCodes` — ADR-001 §6: "Capabilities come from the /self
 * endpoint"; the shared `@upmind-automation/types` `IFunctionality{code}` /
 * `functionalities` field is this codebase's established shape for exactly
 * this kind of permission entry (corroborated independently by
 * `session-store`'s own admin-self fixture querying
 * `with=...,functionalities,...`). `mapSessionUser` does not carry this field
 * through today (checked: `session-store.mappers.ts`/`SessionUser` have no
 * `functionalities` key) — appended onto the mapped user directly so the
 * capability-gating test (AC-B3) can drive the real staff arm either way.
 * See test-report.md "AC-B3 seed-path caveat" for the honest limit on this.
 */
async function seedClientAndStaffSessions(
  functionalityCodes: string[] = [
    "list_client_phones",
    "create_client_phone",
    "update_client_phone",
    "delete_client_phone"
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

// --- recorded fixtures (admin path) — journey bodies MUST come from here,
// never a locally manufactured builder (`scope-based/no-hand-rolled-int-fixture`).

const listBody = getFixtureBody<PhonesEnvelope<PhoneRecord[]>>(
  "get-admin-clients-id-phones-with-staged-imports-1",
  { recordingsDir }
);
const createBody = getFixtureBody<PhonesEnvelope<PhoneRecord>>(
  "post-admin-clients-id-phones",
  { recordingsDir }
);
const updateBody = getFixtureBody<PhonesEnvelope<PhoneRecord>>(
  "put-admin-clients-id-phones-id",
  { recordingsDir }
);
const deleteBody = getFixtureBody<PhonesEnvelope<null>>(
  "delete-admin-clients-id-phones-id",
  { recordingsDir }
);

const FIRST_PHONE_ID = listBody.data[0].id;

/** Reshapes the recorded list envelope to a single row — not a fabricated body. */
function oneRow(record: PhoneRecord): PhonesEnvelope<PhoneRecord[]> {
  return { ...listBody, data: [record], total: 1 };
}

// -----------------------------------------------------------------------------

describe("client-phone-dry — staff (.as('staff').for('client', id))", () => {
  beforeEach(() => {
    clearSessionCookies();
    sessionStorage.clear();
    useClientPhonesDry().as(ScopeActorTypes.CLIENT).useActions().destroy();
    useClientPhonesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID)
      .useActions()
      .destroy();
  });

  it("AC-B1 (HEADLINE, A7): the list request retargets to admin/clients/{TARGET}/phones with the staff token", async () => {
    const { staffToken } = await seedClientAndStaffSessions();

    const seenRequests: { url: string; auth: string | null }[] = [];
    server?.use(
      http.get("*/clients/*/phones", ({ request }) => {
        seenRequests.push({
          url: request.url,
          auth: request.headers.get("Authorization")
        });
        return HttpResponse.json(oneRow(listBody.data[0]), { status: 200 });
      })
    );

    const phones = useClientPhonesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await phones
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value.length).toBe(1)
    );

    expect(seenRequests.length).toBeGreaterThan(0);
    const [seen] = seenRequests;

    // URL retarget: admin path, keyed on the TARGET, never the session client.
    expect(seen.url).toContain(`admin/clients/${TARGET_CLIENT_ID}/phones`);
    expect(seen.url).not.toContain(`clients/${SESSION_CLIENT_ID}/phones`);

    // Auth identity transport: the STAFF token, exactly — never the
    // active/client token (exact-match, not substring: the derived staff
    // token is `${clientToken.access_token}-staff`, so a substring check
    // would trivially "pass" even against the client token).
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      {
        recordingsDir: sessionStoreRecordingsDir
      }
    );
    expect(seen.auth).toBe(`Bearer ${staffToken.access_token}`);
    expect(seen.auth).not.toBe(`Bearer ${clientToken.access_token}`);
  });

  it("AC-B2: add/update/remove/setDefault retarget to admin/clients/{TARGET}/phones[/{id}] with the staff token", async () => {
    const { staffToken } = await seedClientAndStaffSessions();
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      {
        recordingsDir: sessionStoreRecordingsDir
      }
    );

    server?.use(
      http.get("*/clients/*/phones", () =>
        HttpResponse.json(oneRow(listBody.data[0]), { status: 200 })
      )
    );

    const mutations: { method: string; url: string; auth: string | null }[] =
      [];
    server?.use(
      http.post("*/clients/*/phones", ({ request }) => {
        mutations.push({
          method: "POST",
          url: request.url,
          auth: request.headers.get("Authorization")
        });
        return HttpResponse.json(createBody, { status: 200 });
      }),
      http.put("*/clients/*/phones/*", ({ request }) => {
        mutations.push({
          method: "PUT",
          url: request.url,
          auth: request.headers.get("Authorization")
        });
        return HttpResponse.json(updateBody, { status: 200 });
      }),
      http.delete("*/clients/*/phones/*", ({ request }) => {
        mutations.push({
          method: "DELETE",
          url: request.url,
          auth: request.headers.get("Authorization")
        });
        return HttpResponse.json(deleteBody, { status: 200 });
      })
    );

    const phones = useClientPhonesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await phones
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value.length).toBe(1)
    );

    await phones.useActions().add?.({
      type: 1,
      phone: {
        number: "+15559876543",
        nationalNumber: "5559876543",
        countryCallingCode: "1",
        country: "US"
      }
    });
    phones.useActions().update?.(FIRST_PHONE_ID, {
      type: 2,
      phone: {
        number: "+15551112222",
        nationalNumber: "5551112222",
        countryCallingCode: "1",
        country: "US"
      }
    });
    phones.useActions().remove?.(FIRST_PHONE_ID);

    await vi.waitFor(() => expect(mutations.length).toBeGreaterThanOrEqual(2));

    for (const mutation of mutations) {
      expect(mutation.url).toContain(
        `admin/clients/${TARGET_CLIENT_ID}/phones`
      );
      expect(mutation.url).not.toContain(`clients/${SESSION_CLIENT_ID}/phones`);
      // Exact-match, both directions — on every mutation, not just the list.
      expect(mutation.auth).toBe(`Bearer ${staffToken.access_token}`);
      expect(mutation.auth).not.toBe(`Bearer ${clientToken.access_token}`);
    }
  });

  it("AC-B3: remove is undefined for a staff session lacking delete_client_phone, and a function once granted", async () => {
    server?.use(
      http.get("*/clients/*/phones", () =>
        HttpResponse.json(oneRow(listBody.data[0]), { status: 200 })
      )
    );

    await seedClientAndStaffSessions([
      "list_client_phones",
      "create_client_phone",
      "update_client_phone"
    ]);
    const denied = useClientPhonesDry()
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
      "list_client_phones",
      "create_client_phone",
      "update_client_phone",
      "delete_client_phone"
    ]);
    const granted = useClientPhonesDry()
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

  it("AC-B4 (ensure create-gate): ensure is undefined for a staff session lacking create_client_phone, and a function once granted", async () => {
    server?.use(
      http.get("*/clients/*/phones", () =>
        HttpResponse.json(oneRow(listBody.data[0]), { status: 200 })
      )
    );

    await seedClientAndStaffSessions([
      "list_client_phones",
      "update_client_phone",
      "delete_client_phone"
    ]);
    const denied = useClientPhonesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await denied
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(denied.useContext().data.value.length).toBe(1)
    );
    expect(typeof denied.useActions().ensure).toBe("undefined");

    denied.useActions().destroy();
    clearSessionCookies();
    sessionStorage.clear();

    await seedClientAndStaffSessions([
      "list_client_phones",
      "create_client_phone",
      "update_client_phone",
      "delete_client_phone"
    ]);
    const granted = useClientPhonesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await granted
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(granted.useContext().data.value.length).toBe(1)
    );
    expect(typeof granted.useActions().ensure).toBe("function");
  });

  it("AC-12a (shared, staff arm): the retargeted list also carries with_staged_imports=1 and locks a staged row", async () => {
    await seedClientAndStaffSessions();

    const seenQueries: string[] = [];
    server?.use(
      http.get("*/clients/*/phones", ({ request }) => {
        seenQueries.push(new URL(request.url).search);
        return HttpResponse.json(
          oneRow({ ...listBody.data[0], id: "staged-1", staged_import: true }),
          { status: 200 }
        );
      })
    );

    let deletes = 0;
    server?.use(
      http.delete("*/clients/*/phones/*", () => {
        deletes += 1;
        return HttpResponse.json(deleteBody, { status: 200 });
      })
    );

    const phones = useClientPhonesDry()
      .as(ScopeActorTypes.STAFF)
      .for("client", TARGET_CLIENT_ID);
    await phones
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(phones.useContext().data.value.length).toBe(1)
    );

    expect(seenQueries.some(q => q.includes("with_staged_imports=1"))).toBe(
      true
    );
    const staged = phones.useContext().data.value[0];
    expect(staged.meta.isStaged).toBe(true);
    expect(phones.useContext().canEdit?.(staged)).toBe(false);

    phones.useActions().remove?.("staged-1");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(deletes).toBe(0);
  });
});
