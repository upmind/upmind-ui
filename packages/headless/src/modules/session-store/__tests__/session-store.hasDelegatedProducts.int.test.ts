/**
 * @fileoverview hasDelegatedProducts — the delegate-side flag (integration)
 *
 * ## Job To Be Done
 * Prove `useActiveSession().useMeta().hasDelegatedProducts` reads off the
 * session that boot actually built, against this module's RECORDED `/self`
 * fixture.
 *
 * ## Coverage this file deliberately does NOT claim
 * Only the FALSE path is proven here, because `delegated_ids` is `null` in
 * every recorded `/self` fixture in this repo. The TRUE path — a client that
 * genuinely holds a delegated contract product or a delegated client — has
 * never been recorded, so it is not proven at any layer and is tagged `@todo`
 * in `session-store.delegated.feature`.
 *
 * That gap is NOT to be closed by constructing a `SessionUser` or a `/self`
 * payload by hand. Test data comes from recordings. A suite that manufactured
 * its own input would certify a contract no real system has returned.
 *
 * ## What Breaks If These Fail
 * A client with no delegated access is offered the delegated-products view, or
 * a session persisted before the field existed throws on every page load.
 */

import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { FakeBroadcastChannel } from "./fake-broadcast-channel";
import { server } from "./setup.integration";
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

  // The recorded `/self` fixture's own `delegated_ids: null`, mapped exactly as
  // boot maps it (`mapSessionUser`'s `?? {}` defence), reads false.
  it("reads false off the recorded /self fixture, whose delegated_ids is null @AC-DG7", async () => {
    const clientToken = getFixtureBody<IToken>(
      "post-oauth-access-token-client",
      { recordingsDir }
    );
    const selfBody = getFixtureBody<SelfEnvelope>("get-self", {
      recordingsDir
    }).data;

    await ctx
      .useSessionStore()
      .useActions()
      .add(clientToken, true, ctx.mapSessionUser(selfBody));

    const meta = ctx.useActiveSession().useMeta();
    await vi.waitFor(() => expect(meta.hasDelegatedProducts.value).toBe(false));
  });

  // The staff (@AC-DG5) and guest (@AC-DG6) rows are proven once, in
  // `session-store.delegated.int.test.ts`. They are deliberately NOT re-proven
  // here — one behaviour, one home.
});
