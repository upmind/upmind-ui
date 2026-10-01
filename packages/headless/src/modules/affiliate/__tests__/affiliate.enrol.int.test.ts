// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.enrol — a client enrols and the account reads
 * again (@AC4, guard + refused-enrol halves)
 *
 * ## Job To Be Done
 * Protect the `isEnrolled` guard on `enrol()` (design.md §8.5: "`enrol`
 * sends nothing while `isEnrolled` is true") and the failure path a refused
 * enrol POST takes (design.md §8.2 Failure surface: no follow-up load).
 *
 * ## Real capture used for the refusal — reached honestly, not bypassed
 * The one real account this unit can seed is ALREADY enrolled, so the
 * client-side `isEnrolled` guard normally blocks `enrol()` before any
 * request goes out — the guard scenario and a genuine refusal scenario would
 * otherwise be the identical code path. To reach the REAL recorded
 * `post-accounts-id-affiliate-case-rejected` capture (409 "Affiliate account
 * already exists") honestly, the refusal scenario first overrides the
 * ACCOUNT READ to the sanctioned 404 control response (the same exemption
 * `affiliate.error-reload` uses — `code-tests.companion.md`: "Control and
 * error responses are exempt"), which makes `isEnrolled` read false and lets
 * the guard pass. `enrol()` then sends its POST, which the replay pool
 * answers from the REAL rejected capture — nothing about the server's
 * refusal is invented.
 *
 * ## Happy path (R-ENROL-2, review-notes.md 2026-10-01) — CLOSED
 * bdd.md's AC4 row also plans an "Enrol" happy-path scenario (a not-enrolled
 * account that successfully enrols). A second, distinct staging client was
 * granted a one-time enrol under R-ENROL-2 after R-ENROL's own captures on
 * `otherClient` were lost (CONTROLS.md pass 16-18). The real not-enrolled
 * 404, the real enrol-success 200, and the real enrolled re-read are now
 * recorded (`affiliate.fixtures.ts`'s own R-ENROL-2 block) and drive the
 * "A client enrols in the affiliate programme" scenario below through the
 * real `useClientAffiliate`, via `serveSequence` on the account route. The
 * session is seeded from that client's OWN recorded `self` capture
 * (`ENROL2_SELF_CAPTURE`), so the account route the module addresses is the
 * account the three captures were recorded for.
 *
 * Stated omissions (ADR-021, design.md §8.2): the refused-enrol case below
 * IS this spec's failure branch; no other 4xx/5xx applies to `enrol()`. In the
 * enrol case the balance and settings reads answer from the `client`
 * recordings by route; that case asserts they are sent, never their values.
 *
 * The refused case counts the ONE outbound POST to `/accounts/{id}/affiliate`
 * and asserts the real recorded 409 message — `hasError` alone would stay
 * green under a guard mutant that errors locally with no request. It now
 * also pins the POST route to the real `rejected` capture explicitly: the
 * R-ENROL-2 pass added a real BASE (no-`case`) enrol-success capture on this
 * SAME route, which the replay pool's identity matcher now serves by default
 * to any request carrying no `case` — so a request that genuinely carries no
 * `case` (production traffic) now gets the real success, and only an
 * explicit `serveCapture` override reaches the `rejected` capture for this
 * test's own refusal scenario.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useClientAffiliate } from "../useClientAffiliate";
import {
  ENROL2_SELF_CAPTURE,
  recordedAccountId,
  seedRealClient,
  seedRecordedClient,
  serveCapture,
  serveFailure,
  serveSequence
} from "./affiliate.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const ENROL_ROUTE = "*/api/accounts/:accountId/affiliate";

describe("affiliate.enrol — a client enrols and the account reads again", () => {
  it("an already-enrolled client's repeat enrolment is a no-op", async () => {
    await seedRealClient();
    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();
    expect(affiliate.useMeta().isEnrolled.value).toBe(true);

    let enrolPosts = 0;
    server?.events.on("request:start", ({ request }) => {
      if (
        request.method === "POST" &&
        /\/affiliate$/.test(new URL(request.url).pathname)
      ) {
        enrolPosts += 1;
      }
    });

    await affiliate.useActions().enrol();

    expect(enrolPosts).toBe(0);
  });

  it("a client's enrolment attempt on an account the server already enrolled is refused, and no full load runs", async () => {
    await seedRealClient();
    // Sanctioned 404 control response (see file header) — makes isEnrolled
    // read false so the client-side guard passes and enrol() actually sends.
    serveFailure("get", ENROL_ROUTE, 404);
    // Pin the POST to the real `rejected` capture — the R-ENROL-2 base
    // (no-`case`) success capture now also exists on this route, and the
    // replay pool's identity matcher serves THAT by default to a real,
    // case-less request (see file header). This override keeps this
    // refusal scenario reaching the real 409, not the real 200.
    serveCapture(
      "post",
      ENROL_ROUTE,
      "post-accounts-id-affiliate-case-rejected"
    );

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();
    expect(affiliate.useMeta().isEnrolled.value).toBe(false);

    let accountGets = 0;
    let balanceGets = 0;
    let areaGets = 0;
    let enrolPosts = 0;
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (request.method === "POST" && /\/affiliate$/.test(url.pathname)) {
        enrolPosts += 1;
        return;
      }
      if (request.method !== "GET") return;
      if (/\/affiliate\/balance$/.test(url.pathname)) balanceGets += 1;
      else if (/\/affiliate$/.test(url.pathname)) accountGets += 1;
      else if (
        url.pathname.endsWith("/config/brand/values") &&
        url.search.includes("affiliate_systems.settings.withdraw_request")
      ) {
        areaGets += 1;
      }
    });

    await affiliate.useActions().enrol();

    // Real, recorded 409 "Affiliate account already exists".
    expect(affiliate.useMeta().hasError.value).toBe(true);
    expect(affiliate.useMeta().isEnrolled.value).toBe(false);
    expect(affiliate.useMeta().isProcessing.value).toBe(false);
    expect(accountGets).toBe(0);
    expect(balanceGets).toBe(0);
    expect(areaGets).toBe(0);

    // A guard mutant that errors locally with no request stays green under
    // `hasError` alone — pin the one outbound POST and the real recorded
    // message too.
    expect(enrolPosts).toBe(1);
    expect(JSON.stringify(affiliate.useContext().error.value)).toContain(
      "Affiliate account already exists"
    );
  });

  it("A client enrols in the affiliate programme", async () => {
    await seedRecordedClient(ENROL2_SELF_CAPTURE);
    // serveSequence (design.md §8.9 helpers of T05): the FIRST account GET
    // reads not-enrolled, the SECOND (the full-load re-read after enrol())
    // reads the real enrolled-again body — the R-ENROL-2 captures, in the
    // exact order design.md §8.9 names ("AC4 uses `not-enrolled` then
    // `after-enrol`").
    serveSequence("get", ENROL_ROUTE, [
      "get-accounts-id-affiliate-case-not-enrolled-with-staged-imports-1",
      "get-accounts-id-affiliate-case-after-enrol-with-staged-imports-1"
    ]);
    // The real enrol-success base capture now exists on this route and is
    // served by default (see file header) — pinned explicitly anyway, so
    // this test never silently depends on replay default-fallback ordering.
    serveCapture("post", ENROL_ROUTE, "post-accounts-id-affiliate");

    const affiliate = useClientAffiliate().as(ScopeActorTypes.CLIENT);
    await affiliate.useActions().isReady();
    expect(affiliate.useMeta().isEnrolled.value).toBe(false);
    expect(affiliate.useMeta().hasError.value).toBe(false);

    let accountGets = 0;
    let balanceGets = 0;
    let areaGets = 0;
    let enrolPosts = 0;
    const enrolPostPaths: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (request.method === "POST" && /\/affiliate$/.test(url.pathname)) {
        enrolPosts += 1;
        enrolPostPaths.push(url.pathname);
        return;
      }
      if (request.method !== "GET") return;
      if (/\/affiliate\/balance$/.test(url.pathname)) balanceGets += 1;
      else if (/\/affiliate$/.test(url.pathname)) accountGets += 1;
      else if (
        url.pathname.endsWith("/config/brand/values") &&
        url.search.includes("affiliate_systems.settings.withdraw_request")
      ) {
        areaGets += 1;
      }
    });

    // Without reload: the same `useClientAffiliate` instance, no new
    // composable, no page navigation.
    await affiliate.useActions().enrol();

    expect(enrolPosts).toBe(1);
    expect(
      enrolPostPaths.some(path =>
        path.includes(recordedAccountId(ENROL2_SELF_CAPTURE))
      )
    ).toBe(true);
    // design.md §8.2 "enrol ... run the full load again: the account, the
    // balance and the area settings" / §8.5 "enrol runs the full load again".
    // pseudo-Nathan review pass 19, cardinal call 3: the Then promises all
    // three reads, not account alone — the observer's own invalidation
    // refetch of the account key could satisfy `accountGets >= 1` by itself,
    // so the balance and area-settings reads are each asserted too. The exact
    // count (the full reload PLUS any active tanstack-query observer's own
    // invalidation-driven refetch of the same key) is an implementation
    // nuance this assertion does not over-pin.
    expect(accountGets).toBeGreaterThanOrEqual(1);
    expect(balanceGets).toBeGreaterThanOrEqual(1);
    expect(areaGets).toBeGreaterThanOrEqual(1);
    expect(affiliate.useMeta().isEnrolled.value).toBe(true);
    expect(affiliate.useMeta().hasError.value).toBe(false);
    expect(affiliate.useMeta().isProcessing.value).toBe(false);
  });
});
