/**
 * @fileoverview hasDelegatedProducts — the delegate-side two-key disjunction
 * (integration)
 *
 * ## Job To Be Done
 * Prove `useActiveSession().useMeta().hasDelegatedProducts` reproduces the
 * oracle's exact two-key disjunction (`contracts_product` OR `client` —
 * `ticket` deliberately excluded), off:
 *  - a directly-constructed `SessionUser` (a pure derivation over a typed
 *    object, not a wire contract — no populated `/self` fixture is
 *    hand-authored or presented as recorded);
 *  - the recorded `/self` fixture's own `delegated_ids: null`, mapped
 *    exactly as boot does;
 *  - a session user persisted before this field existed (no `delegatedIds`
 *    key at all), which must read false and must not throw.
 *
 * This module's `add()` schedules background query-core activity even when
 * a user is supplied directly, so this file runs at the integration layer
 * (replaying this module's own recorded fixtures via MSW) rather than unit
 * — the unit project starts no replay server and that background activity
 * hangs/errors there.
 *
 * ## What Breaks If These Fail
 * A client with delegated access to a contract product or another client
 * never sees the delegated-products toggle; a "clean-up" that folds
 * `ticket` into the disjunction silently over-grants the toggle to clients
 * who only hold a delegated ticket; a user persisted to sessionStorage
 * before this field shipped throws on every page load instead of reading
 * no delegated access.
 */

import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { AccessRoleTypes, UpmindObjectTypes } from "@upmind-automation/types";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { FakeBroadcastChannel } from "./fake-broadcast-channel";
import { server } from "./setup.integration";
import type { SessionUser } from "../session-store.types";
import type { IToken, ISelf } from "@upmind-automation/types";

vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type SelfEnvelope = { data: ISelf };

async function freshImports() {
  vi.resetModules();
  const sessionStoreModule = await import("../useSessionStore");
  const activeSessionModule = await import("../useActiveSession");
  const barrel = await import("..");

  return {
    useSessionStore: sessionStoreModule.useSessionStore,
    useActiveSession: activeSessionModule.useActiveSession,
    mapSessionUser: barrel.mapSessionUser
  };
}

function clientToken(overrides: Partial<IToken> = {}): IToken {
  return {
    access_token: "unit-client-token",
    created_at: Date.now(),
    expires_in: 3600,
    refresh_expires_in: 7200,
    refresh_token: "unit-client-refresh",
    second_factor_required: false,
    actor_id: "unit-client-1",
    actor_type: `${AccessRoleTypes.CLIENT}`,
    ...overrides
  } as IToken;
}

function sessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "unit-client-1",
    email: "unit-client@example.com",
    username: "unit-client",
    language: "en",
    locale: "en-GB",
    delegatedIds: {},
    ...overrides
  };
}

// -----------------------------------------------------------------------------

describe("hasDelegatedProducts", () => {
  let ctx: Awaited<ReturnType<typeof freshImports>>;

  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    FakeBroadcastChannel.reset();
    ctx = await freshImports();
    await ctx.useSessionStore().initStore();
  });

  afterEach(async () => {
    server?.events.removeAllListeners();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it("reads true off a session user holding a delegated contract product @AC-DG7", async () => {
    await ctx
      .useSessionStore()
      .useActions()
      .add(
        clientToken(),
        true,
        sessionUser({
          delegatedIds: {
            [UpmindObjectTypes.CONTRACTS_PRODUCT]: ["contract-product-1"]
          }
        })
      );

    const meta = ctx.useActiveSession().useMeta();
    await vi.waitFor(() => expect(meta.hasDelegatedProducts.value).toBe(true));
  });

  it("reads true off a session user holding a delegated client @AC-DG7", async () => {
    await ctx
      .useSessionStore()
      .useActions()
      .add(
        clientToken(),
        true,
        sessionUser({
          delegatedIds: {
            [UpmindObjectTypes.CLIENT]: ["delegated-client-1"]
          }
        })
      );

    const meta = ctx.useActiveSession().useMeta();
    await vi.waitFor(() => expect(meta.hasDelegatedProducts.value).toBe(true));
  });

  // The recorded `/self` fixture's `delegated_ids: null`, mapped exactly as
  // boot does (`mapSessionUser`'s `?? {}` defence), reads false.
  it("reads false off the recorded /self fixture, whose delegated_ids is null @AC-DG7", async () => {
    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    }).data;

    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken(), true, ctx.mapSessionUser(selfBody));

    const meta = ctx.useActiveSession().useMeta();
    await vi.waitFor(() => expect(meta.hasDelegatedProducts.value).toBe(false));
  });

  // THE SCOPE-PINNING CONTROL. `ticket` is deliberately excluded from the
  // oracle's disjunction; a "fix" that folds it in must fail this.
  it("reads false when only a delegated ticket is held — ticket is not in the disjunction @AC-DG8", async () => {
    await ctx
      .useSessionStore()
      .useActions()
      .add(
        clientToken(),
        true,
        sessionUser({
          delegatedIds: {
            [UpmindObjectTypes.TICKET]: ["delegated-ticket-1"]
          }
        })
      );

    const meta = ctx.useActiveSession().useMeta();
    await vi.waitFor(() => expect(meta.hasDelegatedProducts.value).toBe(false));
  });

  // THE LEGACY-PERSISTED-SHAPE CONTROL. A session user object with no
  // `delegatedIds` key at all (persisted before the field existed, so
  // `buildInitialState()` restores it verbatim with no remap) must read
  // false and must not throw. Every other case in this suite goes through
  // `mapSessionUser`'s `?? {}` defence or a directly-constructed object that
  // still carries the key — nothing else exercises a key that is simply
  // absent.
  it("reads false and does not throw for a legacy session user with no delegatedIds key at all @AC-DG9", async () => {
    const legacyUser: Partial<SessionUser> = sessionUser();
    delete legacyUser.delegatedIds;

    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken(), true, legacyUser as SessionUser);

    const meta = ctx.useActiveSession().useMeta();
    expect(() => meta.hasDelegatedProducts.value).not.toThrow();
    expect(meta.hasDelegatedProducts.value).toBe(false);
  });
});
