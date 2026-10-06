// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The stats page shows the signed-in client's own counts, and
 * the refusal state of their usage read
 *
 * ## Job To Be Done
 * Prove AC-12 AND AC-17 (requirements.md) on the ONE page the merged
 * `useStats` module draws: when an operator opens the stats page of the
 * playground, the page shows the four dashboard counts of the signed-in
 * client, and below them the refusal state of the usage read. This is the
 * playground read-back the module feature file carries no scenario for
 * (bdd.md binds it to this spec path instead) — the module's own
 * `stats.orders`/`invoices`/`unpaid`/`tickets` and
 * `stats.usage-visibility`/`usage-refusal` integration specs prove the
 * composable publishes the right count and the right refusal; this spec
 * proves the page draws them, off the rendered markup rather than off the
 * composable directly.
 *
 * THE TWO CONCERNS ARE READ APART. The four tiles are read off their own
 * `data-test-key`s and the usage block off `upmind-usage-refused`, because
 * the usage read is host-gated and the tile reads are not.
 *
 * Each value is read off `data-test-value`, never off visible text: the text
 * is a TRANSLATED label, so matching it would grade the English catalogue
 * instead of the count on screen (P9, `code-tests-e2e.companion.md`).
 *
 * ## What Breaks If These Fail
 * The four dashboard tiles report a number that never moves — a hardcoded
 * placeholder that happens to look plausible — while the module underneath
 * reads the real per-client count correctly. A client would see a stat count
 * that never reflects an order, invoice or ticket they actually have.
 *
 * ## Provenance
 * All four counts are read PROGRAMMATICALLY off the committed recordings
 * `packages/headless/src/modules/stats/__tests__/fixtures/*.json`
 * (`get-stats-type-contracts`, `get-stats-type-invoices`,
 * `get-stats-type-invoices-category`, `get-stats-type-tickets`) captured by
 * this story's own fixture generation — no number is authored in this file.
 * The refusal message is read the same way, off
 * `get-clients-upmind-usage.json`; no string is authored here either.
 *
 * ## Clock freeze
 * Every recorded stats fixture pins `date_to` to the recording day
 * ({@link RECORDED_DATE}). The shared corpus replay
 * matches a recording by its whole query sentence, `date_to` included, so
 * on any later day the exact match misses and the replay falls back to an
 * arbitrary fixture — the same failure mode `setup.integration.ts` guards
 * against for the module's own integration specs. This file mirrors that
 * `beforeAll`/`afterAll` freeze rather than reading the module's
 * `statsDateTo()` helper, which would assert the helper against itself.
 * The freeze itself is LOCAL noon, not UTC midnight, for the same reason
 * `setup.integration.ts` states in full: `statsDateTo()` formats LOCAL
 * time, and a UTC-midnight freeze reads as the previous calendar day on
 * any host west of UTC.
 *
 * The usage half needs no clock freeze of its own: `GET
 * api/clients/upmind_usage` carries no `date_to` parameter, so the corpus
 * replay matches that route on method and path alone.
 *
 * @anchor AC-12
 * @anchor AC-17
 */

import { join } from "node:path";
import { mount } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { Suspense, defineComponent, h } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";
import { first } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";
import type { Router } from "vue-router";

// -----------------------------------------------------------------------------

const headlessFixtures = (moduleName: string): string =>
  join(
    process.cwd(),
    "..",
    "..",
    "packages",
    "headless",
    "src",
    "modules",
    moduleName,
    "__tests__",
    "fixtures"
  );

const recordingsDir = headlessFixtures("stats");
const sessionRecordingsDir = headlessFixtures("session-store");

const server = startReplayServer({ recordingsDir });

/**
 * The day the stats fixtures were recorded, and therefore the `date_to`
 * their recorded request paths carry. Kept equal to `RECORDED_DATE` in
 * `packages/headless/src/modules/stats/__tests__/setup.integration.ts`,
 * which cannot be imported here: it starts a replay server of its own at
 * module scope.
 */
const RECORDED_DATE = "2026-09-19";

beforeAll(() => {
  const [year, month, day] = RECORDED_DATE.split("-").map(Number);
  vi.setSystemTime(new Date(year, month - 1, day, 12, 0, 0, 0));
});

afterAll(() => {
  vi.useRealTimers();
});

type CurrencyEnvelope = {
  data: { total: { result: Record<string, Array<{ count: number }>> } };
};
type TicketEnvelope = { data: { open: { result: Array<{ count: number }> } } };
type RefusalEnvelope = { error: { message: string } };

const CURRENCY_KEY = "ALL";

/** Reads the aggregate count a currency-bound recording reports for `ALL`. */
function recordedCurrencyCount(capture: string): number {
  const body = getFixtureBody<CurrencyEnvelope>(capture, { recordingsDir });
  const row = first(body.data.total.result[CURRENCY_KEY]);
  if (!row) {
    throw new Error(
      `The recorded "${capture}" capture carries no "${CURRENCY_KEY}" row.`
    );
  }
  return row.count;
}

/** Reads the recorded open-tickets count off the tickets recording. */
function recordedTicketCount(): number {
  const body = getFixtureBody<TicketEnvelope>("get-stats-type-tickets", {
    recordingsDir
  });
  const row = first(body.data.open.result);
  if (!row) {
    throw new Error(
      `The recorded "get-stats-type-tickets" capture carries no result row.`
    );
  }
  return row.count;
}

/** Reads the recorded refusal message off the usage-refusal recording. */
function recordedRefusalMessage(): string {
  const body = getFixtureBody<RefusalEnvelope>("get-clients-upmind-usage", {
    recordingsDir
  });
  if (!body.error?.message) {
    throw new Error(
      `The recorded "get-clients-upmind-usage" capture carries no error message.`
    );
  }
  return body.error.message;
}

/**
 * The `data-test-value` published under a tile keyed by `data-test-key`. The
 * two attributes sit on different elements here (the key on the tile's own
 * wrapper, the value on its `<dd>`), so the value is read off the nearest
 * `[data-test-value]` DESCENDANT of the keyed wrapper, never off the wrapper
 * itself.
 */
function tileValue(key: string): string | undefined {
  const self = document.body.querySelector(`[data-test-key="${key}"]`);
  return (
    self?.getAttribute("data-test-value") ??
    self?.querySelector("[data-test-value]")?.getAttribute("data-test-value") ??
    undefined
  );
}

// -----------------------------------------------------------------------------

let mounted: VueWrapper | undefined;
let router: Router | undefined;

async function seedClientSession(): Promise<void> {
  const { queryClient, useSessionStore, useActiveSession, mapSessionUser } =
    await import("@upmind-automation/headless");

  queryClient.clear();
  server?.use(
    http.get("*/org/modules", () =>
      HttpResponse.json({ status: "ok", data: [] })
    ),
    http.get("*/config/brand/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/config/organisation/values", () =>
      HttpResponse.json({ status: "ok", data: {} })
    ),
    http.get("*/brand/settings", () =>
      HttpResponse.json({ status: "ok", data: {} })
    )
  );

  const guest = getFixtureBody<{ access_token: string }>(
    "post-oauth-access-token-guest",
    { recordingsDir: sessionRecordingsDir }
  );
  server?.use(
    http.post("*/oauth/access_token", () =>
      HttpResponse.json({ status: "ok", data: guest })
    )
  );

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
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(true);
  });
}

async function clearClientSession(): Promise<void> {
  const { queryClient, useSessionStore, useActiveSession } =
    await import("@upmind-automation/headless");

  try {
    useSessionStore().useActions().logout();
  } catch {
    // No active session to log out of.
  }
  queryClient.clear();

  await vi.waitFor(() => {
    expect(useActiveSession().useMeta().isAuthenticated.value).toBe(false);
  });
}

async function mountStatsPage(): Promise<VueWrapper> {
  const page = (
    await import("../../../modules/scenarios/useStats/stats.page.vue")
  ).default as Component;

  router ??= createRouter({
    history: createWebHistory(),
    routes: [{ path: "/useStats", name: "useStats", component: page }]
  });

  await router.push("/useStats");
  await router.isReady();

  const { queryClient, useRoutingEngine } =
    await import("@upmind-automation/headless");
  useRoutingEngine().init(router);
  const { VueQueryPlugin } = await import("@tanstack/vue-query");

  const host = defineComponent({
    setup: () => () => h(Suspense, null, { default: () => h(page) })
  });

  mounted = mount(host, {
    attachTo: document.body,
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] }
  });
  return mounted;
}

// -----------------------------------------------------------------------------

describe("the stats page, read by the client who owns the counts", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(async () => {
    mounted?.unmount();
    mounted = undefined;
    document.body.innerHTML = "";
    server?.resetHandlers();
    await clearClientSession();
  });

  it("shows the four dashboard counts of the signed-in client, read from the platform (@AC-12)", async () => {
    await mountStatsPage();

    const expected: Record<string, string> = {
      "total-orders": String(recordedCurrencyCount("get-stats-type-contracts")),
      "total-invoices": String(
        recordedCurrencyCount("get-stats-type-invoices")
      ),
      "unpaid-invoices": String(
        recordedCurrencyCount("get-stats-type-invoices-category")
      ),
      "active-tickets": String(recordedTicketCount())
    };

    for (const [key, value] of Object.entries(expected)) {
      await vi.waitFor(
        () => {
          expect(tileValue(key)).toBe(value);
        },
        { timeout: 10000 }
      );
    }
  }, 15000);

  it("shows the refusal state of the usage read, read from the platform (@AC-17)", async () => {
    await mountStatsPage();

    const expected = recordedRefusalMessage();

    await vi.waitFor(
      () => {
        expect(tileValue("upmind-usage-refused")).toBe(expected);
      },
      { timeout: 10000 }
    );
  }, 15000);
});
