// -----------------------------------------------------------------------------
/**
 * @fileoverview the client a call addresses (integration, AC-9)
 *
 * ## Job To Be Done
 * `resolveClientId` is the seam every client-scoped module resolves its request
 * target through — nine sites, all the same shape. FE-3239 makes a context id
 * OPTIONAL, which widens this seam with no compiler signal: every site already
 * declares `string | undefined`, so a `client` context carrying no entity can
 * start resolving `undefined` AS the identity and nothing goes red. Drive the
 * REAL store, seeded from recorded `/oauth/access_token` and `/self` fixtures,
 * and pin all four inputs the seam must tell apart.
 *
 * The discriminator is a scope naming a DIFFERENT client from the one the
 * session holds: while the two agree, every branch answers the same id and the
 * test proves nothing about which source was read.
 *
 * ## What Breaks If These Fail
 * A request is built around "nobody" instead of falling through to the session's
 * own client — or worse, around the catalogue type the context named. That is
 * the FE-2824 failure class: one actor served another's view.
 *
 * @anchor scope.feature
 * @anchor AC-9
 */

import { join } from "node:path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { FakeBroadcastChannel } from "./fake-broadcast-channel";
import "./setup.integration";
import type { IToken, ISelf } from "@upmind-automation/types";

vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

const OTHER_CLIENT_ID = "other-client-0001";

type SelfEnvelope = { data: ISelf };

/**
 * Boots a fresh module graph and signs one recorded client in.
 *
 * @returns The seam under test, and the client id the SESSION holds.
 */
async function seedClientSession() {
  vi.resetModules();
  const barrel = await import("..");
  const { useSessionStore } = await import("../useSessionStore");

  const token = getFixtureBody<IToken>("post-oauth-access-token-client", {
    recordingsDir
  });
  const self = getFixtureBody<SelfEnvelope>("get-self", { recordingsDir }).data;

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(token, true, barrel.mapSessionUser(self));

  const { activeUser } = useSessionStore().useContext();
  await vi.waitFor(() => expect(activeUser.value?.id).toBeTruthy());

  return {
    resolveClientId: barrel.resolveClientId,
    sessionClientId: String(activeUser.value?.id),
    stopCookieSync: (await import("../session-store.sync")).stopCookieSync
  };
}

// -----------------------------------------------------------------------------

describe("the client a call addresses (AC-9)", () => {
  let ctx: Awaited<ReturnType<typeof seedClientSession>>;

  beforeEach(() => {
    clearSessionCookies();
    sessionStorage.clear();
    FakeBroadcastChannel.reset();
  });

  afterEach(async () => {
    ctx?.stopCookieSync();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it("@AC-9 addresses the named client when the scope names one", async () => {
    ctx = await seedClientSession();

    const resolved = ctx.resolveClientId({
      type: "client",
      id: OTHER_CLIENT_ID
    });

    // The whole point of retargeting: the scope's client wins over the
    // session's own, or `.for('client', id)` addresses nobody.
    expect(resolved.value).toBe(OTHER_CLIENT_ID);
    expect(resolved.value).not.toBe(ctx.sessionClientId);
  });

  it("@AC-9 falls through to the session's own client when the scope names a client but no entity", async () => {
    ctx = await seedClientSession();

    // The guard the optional context id made load-bearing. Without it the seam
    // answers `undefined` — and a caller builds a request around that answer
    // instead of around the client actually signed in.
    expect(ctx.resolveClientId({ type: "client" }).value).toBe(
      ctx.sessionClientId
    );
  });

  it("@AC-9 falls through to the session's own client for a catalogue context", async () => {
    ctx = await seedClientSession();

    // A catalogue names WHAT is being read, never WHO it belongs to, so it may
    // never displace the identity — and its type is not an id.
    const resolved = ctx.resolveClientId({ type: "invoice" });

    expect(resolved.value).toBe(ctx.sessionClientId);
    expect(resolved.value).not.toBe("invoice");
  });

  it("@AC-9 addresses the session's own client when the scope carries no context at all", async () => {
    ctx = await seedClientSession();

    expect(ctx.resolveClientId().value).toBe(ctx.sessionClientId);
  });
});
