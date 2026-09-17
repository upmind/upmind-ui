// -----------------------------------------------------------------------------
/**
 * @module funnels/__tests__/init-deep-link.harness
 * @description The recorded-replay, request-observation and funnel-driving
 * bench FE-3136's read-backs run behind (design §6.5, H1–H4). It serves
 * COMMITTED recordings to the real `useInvoice` / `useOrder` queries, captures
 * the URL of every outbound read, and runs the arriving route through the REAL
 * routing engine — so a read-back grades the funnel's own arms, guards and
 * assigns rather than a service called in the funnel's place.
 *
 * ## Why it exists
 * The labs `component` lane installs no replay server, `recordedBodies`
 * publishes loaders over JSON and nothing that answers an HTTP call, and both
 * composables refuse an unauthenticated caller BEFORE firing — so without this
 * bench every read-back would pass for the wrong reason.
 *
 * ## Provenance
 * Every body served here was captured by `pnpm fixtures:generate invoices` into
 * `packages/headless/src/modules/invoices/__tests__/fixtures/`. Nothing is
 * authored: the only bodies built in this file are the empty envelopes the
 * bootstrap endpoints answer with, which carry no domain data
 * (`overrideRoute`'s own sanctioned "documented empty envelope").
 *
 * ## The lane every consumer of this bench must declare
 * `// @vitest-environment happy-dom` at the top of the spec. The `component`
 * project is jsdom, and node's undici fetch REJECTS a jsdom `AbortSignal`
 * (vitest #8374) — so under jsdom every read fails as a network error before
 * MSW ever sees it, and a read-back reads "nothing was requested" for a reason
 * that has nothing to do with the story. This is the same call
 * `packages/headless/vitest.config.ts` makes for its own integration project.
 */

import { VueQueryPlugin } from "@tanstack/vue-query";
import { http, HttpResponse } from "msw";
import { expect, vi } from "vitest";
import { nextTick } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { getFixture, getFixtureBody } from "@upmind-automation/test-fixtures";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";
import { registerFunnels } from "..";
import {
  ordersRecordingsDir,
  recordingsDir,
  sessionRecordingsDir,
  type InvoiceCase
} from "./init-deep-link.recordings";
import { filter, includes, isNil, map, size } from "lodash-es";
import type {
  FunnelTarget,
  UseRoutingEngine
} from "@upmind-automation/headless";
import type { Plugin } from "vue";
import type { RouteLocation, Router } from "vue-router";

// -----------------------------------------------------------------------------

export type ObservedRequest = { method: string; url: string };

export const server = startReplayServer({ recordingsDir });

// -----------------------------------------------------------------------------

/**
 * Stubs the bootstrap endpoints session-store hits on `initStore()` — none of
 * them an `?init` behaviour — so a suite scoped to the deep link never blocks
 * on them. Re-applied per seed: the replay server resets handlers per test.
 */
function installBackgroundStubs(): void {
  server?.use(
    http.get("*/org/modules", () =>
      HttpResponse.json({ status: "ok", data: [] })
    ),
    http.get("*/config/organisation/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/brand/settings", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/billing_cycles", () =>
      HttpResponse.json({ status: "ok", data: [] })
    ),
    http.get("*/api/wallet/balance", () => {
      const wallet = getFixture("get-wallet-balance", {
        recordingsDir: ordersRecordingsDir
      });
      return HttpResponse.json(wallet.response.body as object, {
        status: wallet.response.status
      });
    })
  );
}

/**
 * Serves the recorded token mint and `/self` read, so the seeded session stays
 * the one the read-backs seeded rather than being reset by a failed re-read.
 */
function installSessionStubs(): void {
  const guest = getFixture("post-oauth-access-token-guest", {
    recordingsDir: sessionRecordingsDir
  });
  const self = getFixture("get-self", { recordingsDir: sessionRecordingsDir });

  server?.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json(guest.response.body as object, {
        status: guest.response.status
      })
    ),
    http.get("*/api/self", () =>
      HttpResponse.json(self.response.body as object, {
        status: self.response.status
      })
    )
  );
}

/**
 * A real client session, seeded from `session-store`'s own recorded token and
 * `/self` read. Not optional scaffolding: `useInvoice` and `useOrder` both
 * reject an unauthenticated caller before firing, so an unseeded read-back
 * observes zero requests and passes for the wrong reason.
 */
export async function seedClientSession(): Promise<void> {
  const { queryClient, useSessionStore, useActiveSession, mapSessionUser } =
    await import("@upmind-automation/headless");

  queryClient.clear();
  installBackgroundStubs();
  installSessionStubs();

  const token = getFixtureBody<{ access_token: string }>(
    "post-oauth-access-token-client",
    { recordingsDir: sessionRecordingsDir }
  );
  const self = getFixtureBody<{ data: { actor: { id: string } } }>("get-self", {
    recordingsDir: sessionRecordingsDir
  });

  await useSessionStore().initStore();
  await useSessionStore()
    .useActions()
    .add(token as never, true, mapSessionUser(self.data as never));

  await vi.waitFor(() => {
    const session = useActiveSession();
    expect(session.useMeta().isAuthenticated.value).toBe(true);
    expect(session.useContext().activeUser.value?.id).toBeTruthy();
  });
}

/** Drops the seeded session, for the signed-out arrival legs (AC6). */
export async function clearClientSession(): Promise<void> {
  const { queryClient, useSessionStore, useActiveSession } =
    await import("@upmind-automation/headless");
  queryClient.clear();
  try {
    useSessionStore().useActions().logout();
  } catch {
    // No active session to log out of.
  }
  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
}

/**
 * The plugins a mounted page needs beside its router — the SAME wiring the app
 * performs through `useUpmind` (`plugins/upmind.client.ts`): TanStack's plugin
 * over headless's OWN query client, so a surface's `useQueryClient()` reads the
 * cache the modules write, and the routing engine's router, which `setParam`
 * writes `?payment_success` through once an order settles. Without them the pay
 * surface throws in `setup` and a paid order rejects unhandled — both red
 * before the first assertion, for a reason no assertion names.
 */
export async function appPlugins(router: Router): Promise<Plugin[]> {
  const { queryClient, useRoutingEngine } =
    await import("@upmind-automation/headless");

  useRoutingEngine().init(router);

  return [router, [VueQueryPlugin, { queryClient }]] as unknown as Plugin[];
}

// -----------------------------------------------------------------------------

export type InvoiceReplay = {
  /** Holds the next read open until `release()`, for the unsettled-load beats. */
  hold: () => void;
  release: () => void;
  reads: () => number;
};

/**
 * Serves `GET /api/invoices/:id` from the chosen recorded case. The pool
 * matcher cannot select a case on its own — `with` is excluded from fixture
 * identity and `case=` is a param no production read sends — so the case is
 * pinned here or an arbitrary body answers every scenario.
 */
export function serveInvoice(invoiceCase: InvoiceCase): InvoiceReplay {
  let reads = 0;
  let gate: Promise<void> | undefined;
  let open: (() => void) | undefined;

  server?.use(
    http.get("*/api/invoices/:id", async () => {
      reads += 1;
      if (gate) await gate;

      const fixture = getFixture(`get-invoices-id-case-${invoiceCase}`, {
        recordingsDir
      });
      return HttpResponse.json(
        fixture.response.body as Record<string, unknown>,
        { status: fixture.response.status }
      );
    })
  );

  return {
    hold: () => {
      gate = new Promise<void>(resolve => (open = resolve));
    },
    release: () => {
      open?.();
      gate = undefined;
    },
    reads: () => reads
  };
}

/**
 * Records the METHOD and URL of every outbound request, so a read-back can
 * assert WHICH invoice was read rather than merely that a read happened.
 */
export function observeRequests(): {
  all: () => ObservedRequest[];
  matching: (fragment: string) => ObservedRequest[];
  count: (fragment: string) => number;
  stop: () => void;
} {
  const observed: ObservedRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    observed.push({ method: request.method, url: request.url });
  };
  server?.events.on("request:start", listener);

  const matching = (fragment: string): ObservedRequest[] =>
    filter(observed, request => includes(request.url, fragment));

  return {
    all: () => map(observed, request => request),
    matching,
    count: fragment => size(matching(fragment)),
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

/**
 * Asserts nothing was requested at `fragment` — as a bounded wait that must
 * TIME OUT, so the absence is a graded claim with a stated window rather than a
 * sleep the beat hopes was long enough.
 */
export async function expectNoRequestTo(
  observed: {
    count: (fragment: string) => number;
    matching: (fragment: string) => ObservedRequest[];
  },
  fragment: string,
  within = 1000
): Promise<void> {
  const requested = await vi
    .waitFor(
      () => {
        expect(observed.count(fragment)).toBeGreaterThan(0);
        return map(observed.matching(fragment), request => request.url);
      },
      { timeout: within, interval: 25 }
    )
    .catch(() => []);

  expect(requested).toEqual([]);
}

// -----------------------------------------------------------------------------

/**
 * The `data-test-value` a rendered surface published under `key`, which is
 * where a value belongs: the visible text is a TRANSLATED label, so matching it
 * grades the English catalogue rather than the record on screen.
 */
export function testValue(
  wrapper: { element: Element },
  key: string
): string | undefined {
  return (
    wrapper.element
      .querySelector(`[data-test-key="${key}"]`)
      ?.getAttribute("data-test-value") ?? undefined
  );
}

/** Whether the surface published `key` — optionally carrying `value`. */
export function hasTestKey(
  wrapper: { element: Element },
  key: string,
  value?: string
): boolean {
  const selector = isNil(value)
    ? `[data-test-key="${key}"]`
    : `[data-test-key="${key}"][data-test-value="${value}"]`;

  return !isNil(wrapper.element.querySelector(selector));
}

// -----------------------------------------------------------------------------

const BENCH_ROUTE = "init-deep-link-bench";

let benchRouter: Router | undefined;

/** Sends REGISTER and waits for the funnel it re-`prepare`s to be guiding. */
async function reprepare(engine: UseRoutingEngine): Promise<void> {
  engine.register(registerFunnels());
  await vi.waitFor(() => expect(engine.meta.value.isGuiding).toBe(true));
  await nextTick();
}

/**
 * Runs the arriving route through the REAL routing engine: the labs funnel
 * config is registered as the app registers it, and `guard()` is the same entry
 * point the routing middleware calls — so the funnel's own `invoke`, its
 * `onError` arms, their `cond`s and their `assign`s all execute, and the
 * returned target is the one the machine produced.
 *
 * @param route - The route the client arrived at, from `arriveAt`.
 * @returns The target the funnel resolved — the overlay child on an admitted
 *   intent, the arriving page on a refusal.
 */
export async function driveFunnel(route: RouteLocation): Promise<FunnelTarget> {
  const { useRoutingEngine } = await import("@upmind-automation/headless");
  const engine = useRoutingEngine();

  if (!benchRouter) {
    benchRouter = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: "/:pathMatch(.*)*",
          name: BENCH_ROUTE,
          component: { template: "<div />" }
        }
      ]
    });
    engine.init(benchRouter);
    // vue-router only starts its initial navigation on the first push, and
    // `isReady()` never resolves until that navigation settles.
    await benchRouter.push("/");
    await benchRouter.isReady();
  }

  // TWICE, and then a graded precondition — not superstition. A refused drive
  // does not clear the target an admitted one assigned, and `awaitResolved`
  // defaults its answer FROM that target, so a stale one is reported as this
  // drive's outcome. REGISTER re-`prepare`s the funnel from the engine's own
  // target, and the engine clears its target only on re-entering `guiding` —
  // one pass after the prepare that read it. So the first pass clears the
  // engine, the second seeds an empty funnel context, and the wait below fails
  // the bench loudly if that ever stops holding.
  await reprepare(engine);
  await reprepare(engine);
  await vi.waitFor(() => expect(engine.target.value?.name).toBeUndefined(), {
    timeout: 5000
  });
  await engine.isReady();

  const target = (await engine.guard(route)) as unknown as FunnelTarget;

  // The machine keeps transitioning after `awaitResolved` hands its answer
  // back, and the next drive's re-prepare reads that settled state. Waiting for
  // the funnel's own target to name what the guard just returned is that
  // quiescence, graded: if the answer never lands in the machine, the bench
  // fails here rather than carrying a half-finished funnel into the next beat.
  await vi.waitFor(() => expect(engine.target.value?.name).toBe(target.name), {
    timeout: 5000
  });

  return target;
}
