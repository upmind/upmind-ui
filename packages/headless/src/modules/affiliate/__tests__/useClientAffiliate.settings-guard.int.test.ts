// -----------------------------------------------------------------------------
/**
 * @fileoverview useClientAffiliate settings guard — an account change reloads
 * the brand settings and a late answer of the previous account is discarded
 *
 * ## Job To Be Done
 * Protect two edges of the settings load that follow an account change (the
 * gate and area key sets of `config/brand/values`, design.md §8.1, §8.5).
 * First, `isReady()` called after the change waits for the new account's own
 * settings instead of resolving on the previous account's loaded state.
 * Second, a settings answer that was in flight for the previous account and
 * lands after the change never overwrites the settings of the new account.
 *
 * ## How the account changes
 * The same real client session of `seedRealClient()` is replaced by the real
 * session of the second recorded staging client (`seedRecordedClient`), through
 * the real session store. No membership or id is written by hand.
 *
 * ## Real captures used
 * The recorded area settings capture (`withdraw_request` on) is the held,
 * previous-account answer, and is released verbatim. The new account's area
 * read is a declared 500 control (code-tests.companion.md: control and error
 * responses are exempt), so the new account's own state differs from the
 * stale answer: `canWithdraw` false, asserted only after
 * `hasPayableCommissions` is true (the recorded £5.00 balance), so the false
 * is the settings' doing and not an empty balance. The third test is the
 * sensitivity check of that assertion: the same held capture, released with no
 * account change, makes `canWithdraw` true. The stale capture holds no
 * `default_redirect`, so no redirect assertion can tell the two apart.
 *
 * ## Controls
 * `useClientAffiliate.settings-guard.must-fail.patch` holds two mutants. The
 * first drops the `settingsLoaded` reset and flips test 1 (`settled` false).
 * The second drops the generation check and flips test 2 (`canWithdraw`).
 *
 * ## What Breaks If These Fail
 * A client who signs in as another account sees `canWithdraw` and the default
 * redirect of the previous account, or a consumer that awaits `isReady()`
 * reads settings that the new account has not loaded yet.
 *
 * Stated omissions (ADR-021, design.md §8.2): no settings capture of a second
 * brand exists, so both clients read the one recorded brand's settings.
 */
import { describe, expect, it, vi } from "vitest";
import { BrandConfigKeys } from "@upmind-automation/types";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useClientAffiliate } from "../useClientAffiliate";
import {
  OTHER_CLIENT_SELF_CAPTURE,
  holdCapture,
  observeRequests,
  recordedAccountId,
  seedRealClient,
  seedRecordedClient,
  serveFailure,
  withBound,
  flushTasks
} from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const BRAND_CONFIG_ROUTE = "*/api/config/brand/values";
const AREA_KEYS = [
  BrandConfigKeys.AFFILIATES_DEFAULT_REDIRECT_LINK,
  BrandConfigKeys.AFFILIATES_WITHDRAW_REQUEST
].join(",");
const AREA_CAPTURE = "get-config-brand-values-dba1bf2f";

const isAreaRead = (url: string) => url.includes("settings.default_redirect");

function observeAreaAnswers(): { count: () => number } {
  let answered = 0;
  server?.events.on("response:mocked", ({ request }) => {
    if (isAreaRead(request.url)) answered += 1;
  });
  return { count: () => answered };
}

describe("useClientAffiliate settings guard — an account change reloads the settings", () => {
  it("A client's readiness waits for the new account's settings after the account changes", async () => {
    await seedRealClient();
    const seen = observeRequests();
    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    expect(await affiliate.useActions().isReady()).toBe(true);

    const hold = holdCapture("get", BRAND_CONFIG_ROUTE, AREA_CAPTURE, {
      match: { keys: AREA_KEYS }
    });
    try {
      await seedRecordedClient(OTHER_CLIENT_SELF_CAPTURE);
      const newAccountId = recordedAccountId(OTHER_CLIENT_SELF_CAPTURE);
      await vi.waitFor(() =>
        expect(
          seen.some(request => request.url.includes(`accounts/${newAccountId}`))
        ).toBe(true)
      );

      let settled = false;
      const ready = affiliate
        .useActions()
        .isReady()
        .then(value => {
          settled = true;
          return value;
        });
      await vi.waitFor(() =>
        expect(seen.filter(request => isAreaRead(request.url))).toHaveLength(2)
      );
      await flushTasks();
      expect(settled).toBe(false);

      hold.release();
      expect(await withBound(ready, 3000, "[settings-guard] isReady()")).toBe(
        true
      );
    } finally {
      hold.release();
    }
  });

  it("A late settings answer of the previous account is discarded after the account changes", async () => {
    await seedRealClient();
    const seen = observeRequests();
    const answers = observeAreaAnswers();
    const hold = holdCapture("get", BRAND_CONFIG_ROUTE, AREA_CAPTURE, {
      match: { keys: AREA_KEYS }
    });
    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    void affiliate.useActions().isReady();
    try {
      await vi.waitFor(() =>
        expect(seen.filter(request => isAreaRead(request.url))).toHaveLength(1)
      );

      serveFailure("get", BRAND_CONFIG_ROUTE, 500, {
        match: { keys: AREA_KEYS }
      });
      await seedRecordedClient(OTHER_CLIENT_SELF_CAPTURE);
      await vi.waitFor(() =>
        expect(seen.filter(request => isAreaRead(request.url))).toHaveLength(2)
      );
      expect(
        await withBound(
          affiliate.useActions().isReady(),
          3000,
          "[settings-guard] isReady()"
        )
      ).toBe(true);

      const answeredBeforeRelease = answers.count();
      hold.release();
      await vi.waitFor(() =>
        expect(answers.count()).toBeGreaterThan(answeredBeforeRelease)
      );
      await flushTasks();

      expect(affiliate.useMeta().hasPayableCommissions.value).toBe(true);
      expect(affiliate.useMeta().canWithdraw.value).toBe(false);
    } finally {
      hold.release();
    }
  });

  it("The held settings answer opens withdrawal for an unchanged account, so the discard assertion can go red", async () => {
    await seedRealClient();
    const seen = observeRequests();
    const hold = holdCapture("get", BRAND_CONFIG_ROUTE, AREA_CAPTURE, {
      match: { keys: AREA_KEYS }
    });
    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    const ready = affiliate.useActions().isReady();
    try {
      await vi.waitFor(() =>
        expect(seen.filter(request => isAreaRead(request.url))).toHaveLength(1)
      );
      hold.release();
      expect(await withBound(ready, 3000, "[settings-guard] isReady()")).toBe(
        true
      );
      expect(affiliate.useMeta().canWithdraw.value).toBe(true);
    } finally {
      hold.release();
    }
  });
});
