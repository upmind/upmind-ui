/**
 * @fileoverview client-address-dry — staff acting AS a client (impersonation,
 * `.as('self')` under an impersonation session) integration — real
 * collection + MSW replay
 *
 * ## Job To Be Done
 * Prove Cell 3 (`docs/sdd/client-address-dry-smoke/design.md` §3.2, D-ADDR-2;
 * `parity.yaml` cell 3, AC-C1) — the A7 identity cell this smoke test's
 * SECOND headline turns on: with an active session that is an impersonation
 * CLIENT token minted for a named TARGET (`auth.services.staff.ts`'s
 * `registerImpersonation` + a CLIENT-typed token for that target, captured
 * against a staff session as the impersonator — the real upstream
 * mechanism, never a module-local branch), `useClientAddressesDry().as('self')`
 * issues its list request to the CLIENT path `clients/{TARGET}/addresses`
 * (never `admin/...`) carrying THAT impersonation client token
 * (never the staff token, never any other client's token) — the request goes
 * out AS THE CLIENT.
 *
 * ## What Breaks If These Fail
 * A staff member acting as a client either leaks onto the admin surface
 * (wrong endpoint) or a stale/wrong token gets sent (wrong identity) — either
 * way the "who is this request FROM" question this cell exists to answer is
 * wrong, in either the URL or the auth half of the A7 proof.
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
const LOCAL_FIXTURES = join(import.meta.dirname, "fixtures");

type SelfResponse = { data: ISelf };
type AddressRow = Record<string, unknown> & { id: string };
type AddressListBody = { status: string; data: AddressRow[]; total: number };

const TARGET_CLIENT_ID = "impersonated-client-7";

const listBody = getFixtureBody<AddressListBody>(
  "get-clients-id-addresses-with-staged-imports-1",
  { recordingsDir: LOCAL_FIXTURES }
);

/**
 * Seeds a STAFF session as active, then transitions to an impersonation of
 * `TARGET_CLIENT_ID`: `registerImpersonation` captures the current active
 * (staff) session as the impersonator BEFORE the impersonation CLIENT token
 * is added and activated — mirrors the real upstream sequence
 * `auth.services.staff.ts:49-77` drives (mint CLIENT token for the target,
 * `registerImpersonation(scopeContext.id)`, then activate it), not a
 * module-local fabrication.
 */
async function seedImpersonationSession(): Promise<{
  impersonationToken: IToken;
  staffToken: IToken;
}> {
  const clientToken = getFixtureBody<IToken>("post-oauth-access-token-client", {
    recordingsDir: sessionStoreRecordingsDir
  });
  const selfResponse = getFixtureBody<SelfResponse>("get-self", {
    recordingsDir: sessionStoreRecordingsDir
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

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(staffToken, true, mapSessionUser(staffSelf.data));

  await vi.waitFor(() => {
    expect(useSessionStore().useContext().activeActor.value).toBe(
      AccessRoleTypes.STAFF
    );
  });

  // Upstream mechanism (auth.services.staff.ts:76-77): register the
  // impersonation BEFORE activating the new client session — captures the
  // CURRENT active session (staff) as the impersonator.
  useSessionStore().useActions().registerImpersonation(TARGET_CLIENT_ID);

  const impersonationToken: IToken = {
    ...clientToken,
    actor_type: AccessRoleTypes.CLIENT,
    actor_id: TARGET_CLIENT_ID,
    access_token: `${clientToken.access_token}-impersonation-${TARGET_CLIENT_ID}`
  };
  const impersonationSelf: SelfResponse = {
    data: {
      ...selfResponse.data,
      actor: {
        ...selfResponse.data.actor,
        id: TARGET_CLIENT_ID,
        email: "target-client@example.com"
      }
    }
  };

  await useSessionStore()
    .useActions()
    .add(impersonationToken, true, mapSessionUser(impersonationSelf.data));

  await vi.waitFor(() => {
    const ctx = useSessionStore().useContext();
    expect(ctx.activeActor.value).toBe(AccessRoleTypes.CLIENT);
    expect(ctx.activeSessionId.value).toBe(TARGET_CLIENT_ID);
  });

  // Sanity: the impersonation relationship IS recorded (the upstream
  // mechanism this cell delegates to, never re-derived by this module).
  expect(
    useSessionStore().useContext().impersonatedSessions.value[TARGET_CLIENT_ID]
  ).toBe(staffToken.actor_id);

  await vi.waitFor(() => {
    const meta = useActiveSession().useMeta();
    expect(meta.isAvailable.value).toBe(true);
    expect(meta.isAuthenticated.value).toBe(true);
  });

  return { impersonationToken, staffToken };
}

// -----------------------------------------------------------------------------

describe("client-address-dry — staff acting as a client (impersonation, .as('self'))", () => {
  beforeEach(() => {
    clearSessionCookies();
    sessionStorage.clear();
    useClientAddressesDry().as(ScopeActorTypes.SELF).useActions().destroy();
    useClientAddressesDry().as(ScopeActorTypes.CLIENT).useActions().destroy();
  });

  it("AC-C1 (A7): the list request goes to clients/{TARGET}/addresses under the impersonation CLIENT token — never admin, never the staff token", async () => {
    const { impersonationToken, staffToken } = await seedImpersonationSession();
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir: sessionStoreRecordingsDir }
    );

    const seenRequests: { url: string; auth: string | null }[] = [];
    server?.use(
      http.get("*/clients/*/addresses", ({ request }) => {
        seenRequests.push({
          url: request.url,
          auth: request.headers.get("Authorization")
        });
        return HttpResponse.json(listBody, { status: 200 });
      })
    );

    const addresses = useClientAddressesDry().as(ScopeActorTypes.SELF);
    await addresses
      .useActions()
      .refresh?.()
      .catch(() => undefined);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBe(
        listBody.data.length
      )
    );

    expect(seenRequests.length).toBeGreaterThan(0);
    const [seen] = seenRequests;

    // URL retarget: the CLIENT path, keyed on the impersonated TARGET —
    // never the admin surface (that would be Cell 2).
    expect(seen.url).toContain(`clients/${TARGET_CLIENT_ID}/addresses`);
    expect(seen.url).not.toContain("/admin/");

    // Auth identity transport: the impersonation CLIENT token, exact-match —
    // never the staff token, never the un-impersonated client token.
    expect(seen.auth).toBe(`Bearer ${impersonationToken.access_token}`);
    expect(seen.auth).not.toBe(`Bearer ${staffToken.access_token}`);
    expect(seen.auth).not.toBe(`Bearer ${clientToken.access_token}`);
  });
});
