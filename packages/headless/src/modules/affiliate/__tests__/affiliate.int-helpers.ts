// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate — integration test helpers (T05, design.md §8.9)
 *
 * ## Job To Be Done
 * The seeding and observation seams every session-dependent integration spec
 * in this unit shares: build a real client session from the ONE real `self`
 * capture this unit's generator recorded (one account, ENROLLED — see
 * `affiliate.fixtures.ts`'s header for the G3 capture gap), serve a
 * synthetic failure/override response through MSW, and
 * observe the outbound requests a composable actually sends.
 *
 * ## What this does NOT provide (capture gap, not a code gap)
 * `seedClient("2A")` / `seedClient("A2")` (design.md §8.9) — a client
 * session with TWO affiliate accounts. No known staging credential has one
 * (operator brief, verified live 2026-09-29). Every spec that needs Seed
 * 2A/A2 stays `@todo` in `affiliate.feature`, named there.
 *
 * ## What Breaks If These Fail
 * Every session-dependent spec in this unit shares this one seeding path —
 * a bug here would silently corrupt every spec's precondition.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { getFixture } from "@upmind-automation/test-fixtures";
import { AccessRoleTypes } from "@upmind-automation/types";
import { useSessionStore, mapSessionUser } from "../../session-store";
import { recorded, recordingsDir, server } from "./setup.integration";
import type { ISelf } from "@upmind-automation/types";

/** The full fixture record (status + body), not just the unwrapped body `recorded()` gives. */
function fullFixture(name: string): {
  response: { status: number; body: unknown };
} {
  return getFixture(name, { recordingsDir }) as {
    response: { status: number; body: unknown };
  };
}

// -----------------------------------------------------------------------------

type SelfEnvelope = { data: ISelf };

export const CLIENT_SELF_CAPTURE = "get-self";
export const OTHER_CLIENT_SELF_CAPTURE = "get-self-case-otherclient";
export const ENROL2_SELF_CAPTURE = "get-self-case-reenrol2-empty-destination";

/**
 * The recorded `self` of ONE named client, matched by its exact file stem. A
 * partial match could return the first recording whose name merely contains
 * the key, which is a different client than the account captures a spec serves.
 */
export function recordedSelf(capture = CLIENT_SELF_CAPTURE): ISelf {
  if (!existsSync(join(recordingsDir, `${capture}.json`))) {
    throw new Error(
      `[affiliate.int-helpers] No recorded self capture is named exactly "${capture}".`
    );
  }
  return recorded<SelfEnvelope>(capture).data;
}

/** The one real account id on a recorded `self` capture. */
export function recordedAccountId(capture = CLIENT_SELF_CAPTURE): string {
  const id = recordedSelf(capture).accounts?.[0]?.id;
  if (!id) {
    throw new Error(
      `[affiliate.int-helpers] The recorded self capture "${capture}" carries no account id.`
    );
  }
  return id;
}

type AffiliateAccountEnvelope = { data: { account?: { brand_id?: string } } };

/**
 * The brand id of the recorded affiliate ACCOUNT capture's own `account`
 * relation — design.md §8.1: "Payout destinations: ... `brandId` =
 * `affiliate.account.brand_id`". Read from this unit's own account capture,
 * never from the `self` capture of a different unit.
 */
export function recordedAffiliateAccountBrandId(): string {
  const brandId = recorded<AffiliateAccountEnvelope>(
    "get-accounts-id-affiliate-with-staged-imports-1"
  ).data.account?.brand_id;
  if (!brandId) {
    throw new Error(
      "[affiliate.int-helpers] The recorded account capture carries no account.brand_id."
    );
  }
  return brandId;
}

/**
 * Seed a client session from ONE named recorded `self` capture, so the session
 * identity is the client whose account captures the spec then serves.
 */
export async function seedRecordedClient(
  capture = CLIENT_SELF_CAPTURE
): Promise<{ accountId: string }> {
  const self = recordedSelf(capture);
  const accountId = recordedAccountId(capture);

  await useSessionStore()
    .useActions()
    .add(
      {
        access_token: "affiliate-int-test-session-token",
        actor_id: self.actor_id,
        actor_type: AccessRoleTypes.CLIENT,
        expires_in: 3600,
        refresh_expires_in: 36000,
        refresh_token: "affiliate-int-test-refresh-token",
        second_factor_required: false,
        token_type: "Bearer",
        twofa_provider: undefined as never
      },
      true,
      mapSessionUser(self)
    );

  return { accountId };
}

/** The `client` credential's session: the single-account, ENROLLED `get-self`. */
export function seedRealClient(): Promise<{ accountId: string }> {
  return seedRecordedClient(CLIENT_SELF_CAPTURE);
}

/**
 * Seed a client session from a DECLARED OVERRIDE of the recorded `self`
 * capture (design.md §8.9 "No hand edit" — the caller changes named fields
 * at the call site, never invents a shape the wire has not returned).
 * `patch` receives a clone of the real recorded `self` body; the caller
 * removes or changes only the named fields.
 */
export async function seedRealClientWithSelfOverride(
  patch: (self: ISelf) => ISelf
): Promise<void> {
  const self = patch(recordedSelf());

  await useSessionStore()
    .useActions()
    .add(
      {
        access_token: "affiliate-int-test-session-token",
        actor_id: self.actor_id,
        actor_type: AccessRoleTypes.CLIENT,
        expires_in: 3600,
        refresh_expires_in: 36000,
        refresh_token: "affiliate-int-test-refresh-token",
        second_factor_required: false,
        token_type: "Bearer",
        twofa_provider: undefined as never
      },
      true,
      mapSessionUser(self)
    );
}

/**
 * Whether a request's query string carries every `[key, value]` pair of
 * `match` (design.md §8.9 Helpers of T05: "`match` holds the query
 * parameters that a request must carry. A request that does not carry them
 * falls through to the replay pool."). With no `match`, every request on
 * the route qualifies.
 */
function requestMatches(
  request: Request,
  match?: Record<string, string>
): boolean {
  if (!match) return true;
  const params = new URL(request.url).searchParams;
  return Object.entries(match).every(
    ([key, value]) => params.get(key) === value
  );
}

/**
 * Serve a synthetic control envelope on `route` — a 500 (or the given
 * status) with the app's error shape, matching the recorded envelope shape.
 * A control response, not backend data — exempt from the recorded-only law
 * (code-tests.companion.md "Control and error responses are exempt").
 *
 * `match` scopes the failure to requests carrying the named query
 * parameters (design.md §8.9 Helpers of T05) — e.g. `{ keys: "..." }` on
 * `config/brand/values` so a failure on the `area` key set leaves the
 * `gate` key set on its base capture, and vice versa (AC25). `once` answers
 * only the first matching request, then falls through to the replay pool
 * (the AC29 401-then-refresh case).
 */
export function serveFailure(
  method: "get" | "post" | "put" | "delete",
  route: string,
  status: number | "network" = 500,
  options?: { match?: Record<string, string>; once?: boolean }
): void {
  if (status === "network") {
    server?.use(
      http[method](route, ({ request }) => {
        if (!requestMatches(request, options?.match)) return undefined;
        return HttpResponse.error();
      })
    );
    return;
  }

  let answered = false;
  server?.use(
    http[method](route, ({ request }) => {
      if (!requestMatches(request, options?.match)) return undefined;
      if (options?.once && answered) return undefined;
      answered = true;
      return HttpResponse.json(
        {
          status: "error",
          data: null,
          related: null,
          total: null,
          error: {
            id: null,
            type: 0,
            code: status,
            message: "Forced error response for negative-path coverage",
            data: null
          },
          messages: null,
          meta: null
        },
        { status }
      );
    })
  );
}

/**
 * Serve `body` at `status` on `route` — used ONLY to build a declared
 * override from a recorded body (design.md §8.9 "No hand edit"): the caller
 * passes a body read via `recorded()`/`recordedSelf()` with named fields
 * changed at the call site, never a hand-authored shape.
 */
export function serveOverride(
  method: "get" | "post" | "put" | "delete",
  route: string,
  body: unknown,
  status = 200
): void {
  server?.use(
    http[method](route, () => HttpResponse.json(body as object, { status }))
  );
}

/**
 * Serve ONE named capture (design.md §8.9 Helpers of T05: "the named-capture
 * helper"). `patch` builds a declared override from the capture's own body,
 * per "No hand edit" — the caller changes named fields at the call site,
 * never invents a shape the wire has not returned. `match` scopes the serve
 * to requests carrying the named query parameters, so an override on one
 * `config/brand/values` key set leaves the other on its base capture.
 *
 * `bodyMatch` scopes the serve to a request whose JSON body satisfies the
 * predicate — ADR-035 "matched by exact identity": a capture recorded for
 * one specific mutating request body must answer that exact request, never
 * a different body on the same route+query (code-tests.companion.md). A
 * request whose body does not satisfy `bodyMatch` falls through to the
 * replay pool, exactly as an unmatched `match` query parameter does.
 */
export function serveCapture<TBody, TReqBody = unknown>(
  method: "get" | "post" | "put" | "delete",
  route: string,
  name: string,
  options?: {
    patch?: (body: TBody) => TBody;
    match?: Record<string, string>;
    bodyMatch?: (body: TReqBody) => boolean;
  }
): void {
  const fixture = fullFixture(name);
  const patched = options?.patch
    ? options.patch(fixture.response.body as TBody)
    : fixture.response.body;

  server?.use(
    http[method](route, async ({ request }) => {
      if (!requestMatches(request, options?.match)) return undefined;
      if (options?.bodyMatch) {
        const body = await request
          .clone()
          .json()
          .catch(() => undefined);
        if (!options.bodyMatch(body as TReqBody)) return undefined;
      }
      return HttpResponse.json(patched as object, {
        status: fixture.response.status
      });
    })
  );
}

/**
 * Serve the named captures in order, one for each matching request, then
 * repeat the last (design.md §8.9 Helpers of T05).
 */
export function serveSequence(
  method: "get" | "post" | "put" | "delete",
  route: string,
  names: string[]
): void {
  let index = 0;
  server?.use(
    http[method](route, () => {
      const name = names[Math.min(index, names.length - 1)];
      index += 1;
      const fixture = fullFixture(name);
      return HttpResponse.json(fixture.response.body as object, {
        status: fixture.response.status
      });
    })
  );
}

/**
 * Serve a capture chosen by the request's own `offset` query parameter
 * (design.md §8.9 Helpers of T05) — `pages` maps an offset string to a
 * capture name, e.g. `{ "0": "...page-1", "1": "...page-2" }`.
 */
export function servePaged(
  method: "get" | "post" | "put" | "delete",
  route: string,
  pages: Record<string, string>
): void {
  server?.use(
    http[method](route, ({ request }) => {
      const offset = new URL(request.url).searchParams.get("offset") ?? "0";
      const name = pages[offset] ?? pages["0"];
      const fixture = fullFixture(name);
      return HttpResponse.json(fixture.response.body as object, {
        status: fixture.response.status
      });
    })
  );
}

/**
 * Bounds an awaited call to a fixed ceiling, well under vitest's own 30s
 * per-test timeout, so a hang rejects with a named, catchable error instead
 * of counting as a bare test-runner timeout (CONTROLS.md row 49: "a flipped
 * assertion, not a mechanical test-runner timeout"). Shared by every spec
 * that drives a manager `update()` whose machine config can genuinely hang
 * under a reordering mutant.
 */
export function withBound<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const bound = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} did not settle within ${ms}ms`)),
      ms
    );
  });
  return Promise.race([promise, bound]).finally(() => clearTimeout(timer));
}

type InputDrivenManager = {
  useActions(): { input(values: never): void };
  useContext(): { model: { value: object | undefined } };
};

/**
 * Drives a manager through the consumer `input()` path and waits for the
 * debounced SET to land on the model, so the next `update()` sends what the
 * consumer typed. A direct write to `model.value` bypasses the input pipeline
 * and survives a `REFRESH` re-seed that a real consumer's edit would not. The
 * pipeline drops an empty string from the model, so `""` settles on absent.
 */
export async function inputAndSettle(
  manager: InputDrivenManager,
  values: Record<string, unknown>
): Promise<void> {
  manager.useActions().input(values as never);
  await vi.waitFor(
    () => {
      const model = manager.useContext().model.value as Record<string, unknown>;
      for (const [key, value] of Object.entries(values)) {
        expect(value === "" ? (model[key] ?? "") : model[key]).toEqual(value);
      }
    },
    { timeout: 3000, interval: 25 }
  );
}

/** The outbound-request observer: every request path/method the replay server saw. */
export function observeRequests(): { method: string; url: string }[] {
  const seen: { method: string; url: string }[] = [];
  server?.events.on("request:start", ({ request }) => {
    seen.push({ method: request.method, url: request.url });
  });
  return seen;
}

/**
 * Build a genuinely pre-ready session store in a NEW JS realm (design.md
 * §8.9 "Helpers of T05", `bootSession`), scoped to this unit's ONE real
 * account (no Seed 2A/A2 — see this file's header). Seeds the CURRENT
 * realm's session (persisted to cookies/`sessionStorage`) before the reset,
 * so the new realm's own `initStore()` restores it from storage, exactly the
 * `freshImports()` precedent (`session-store/__tests__/session-store.int.test.ts`).
 *
 * `start()` calls the new realm's `initStore()` and does NOT await it, so the
 * caller can build a composable from the new-realm handles first and observe
 * it against the store's genuinely-not-ready state. `dispose()` tears down
 * only the new realm's resolver — this module's own barrel exports no public
 * teardown for the session store (Module Visibility Law: `session-store.*`
 * internals, e.g. `stopCookieSync`, are not importable across the module
 * boundary), so the new realm's cookie-sync interval is a known, accepted
 * leak scoped to this one boot per spec run.
 */
export async function bootSingleAccountSession(): Promise<{
  useAffiliateActiveAccount: typeof import("../useAffiliateActiveAccount").useAffiliateActiveAccount;
  useSessionStore: typeof import("../../session-store").useSessionStore;
  start: () => void;
  dispose: () => void;
}> {
  await seedRealClient();

  vi.resetModules();
  const resolverModule = await import("../useAffiliateActiveAccount");
  const sessionStoreModule = await import("../../session-store");

  return {
    useAffiliateActiveAccount: resolverModule.useAffiliateActiveAccount,
    useSessionStore: sessionStoreModule.useSessionStore,
    start: () => {
      void sessionStoreModule.useSessionStore().initStore();
    },
    dispose: () => {
      resolverModule.useAffiliateActiveAccount().useInternals().destroy();
    }
  };
}

/**
 * Build a genuinely pre-ready session store in a NEW JS realm, generic over
 * the caller's own composable import (the F-2 page-mount-order proof, now
 * that account switching's `holdCapture`-on-`accounts/select` mechanism is
 * removed with R-NO-SWITCH). `start()` calls the new realm's `initStore()`
 * and does NOT await it, so the caller can build ITS OWN composable, fresh,
 * from `boot.load(() => import("../useAffiliateLinks"))` and observe its
 * requests against the store's genuinely-not-ready window — the same
 * ordering invariant `bootSingleAccountSession` proves for the resolver's
 * own server guard, generalised to any collection/manager's own boot GET.
 */
export async function bootFreshRealm(): Promise<{
  useSessionStore: typeof import("../../session-store").useSessionStore;
  load: <T>(loader: () => Promise<T>) => Promise<T>;
  start: () => void;
}> {
  await seedRealClient();

  vi.resetModules();
  const sessionStoreModule = await import("../../session-store");

  return {
    useSessionStore: sessionStoreModule.useSessionStore,
    load: async loader => loader(),
    start: () => {
      void sessionStoreModule.useSessionStore().initStore();
    }
  };
}

/**
 * Hold a named capture's response open until `release()` is called (design.md
 * §8.9 "Helpers of T05": "the held-response helper" — planned there, never
 * built, because every scenario that needed it depended on Seed 2A/A2, which
 * this unit's single real account cannot record). The body served on release
 * is the SAME real recorded capture named here — never a hand-authored one.
 * Used only where the held state itself, not a second account, is the thing
 * under proof (an editor's pin-on-open wait over the ONE real account).
 */
export function holdCapture(
  method: "get" | "post" | "put" | "delete",
  route: string,
  name: string
): { release: () => void } {
  let releaseGate: (() => void) | undefined;
  const gate = new Promise<void>(resolve => {
    releaseGate = resolve;
  });
  server?.use(
    http[method](route, async () => {
      await gate;
      const fixture = fullFixture(name);
      return HttpResponse.json(fixture.response.body as object, {
        status: fixture.response.status
      });
    })
  );
  return { release: () => releaseGate?.() };
}
