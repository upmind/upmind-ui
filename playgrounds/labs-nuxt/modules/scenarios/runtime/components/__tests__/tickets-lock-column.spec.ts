// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The ticket listing shows which tickets are LOCKED (FE-3226)
 *
 * ## Job To Be Done
 * `settings.lock` is what refuses close, subject and related-product on a
 * ticket. The listing drew reference, subject, status, department, delegated
 * and updated-at — but not the lock, so a hand could only learn a ticket was
 * unwritable by opening it. This proves the lock now rides the row: the locked
 * row carries a "Locked" badge in the status column (`TableCellBadges` over
 * `meta.isLocked`) and an unlocked row carries none — one column saying what
 * is true of the ticket, rather than a glyph column per flag.
 *
 * ## What Breaks If These Fail
 * The column is declared but scoped at a path the row never carries, so every
 * row draws the same quiet glyph and the listing claims nothing is locked —
 * the exact empty-render class this playground's gates exist for. A presence
 * check ("a lock column exists") passes through that; only reading the FLAGGED
 * state off a genuinely locked row does not.
 *
 * ## Provenance
 * The rows are the `tickets` module's committed capture
 * (`get-tickets-with-staged-imports-1`), replayed behind the real
 * `useTickets` exactly as `tickets-row-navigate.spec.ts` drives
 * it. Staging locked no ticket on this brand, so the FIRST recorded row has ONE
 * documented wire field toggled on — `settings.lock` — which is the technique
 * the module's own recorded-reality oracle uses for the same field
 * (`tickets.manager.int.test.ts`, AC-24). No fixture file is modified, and no
 * row is authored.
 */

import { join } from "node:path";
import { mount } from "@vue/test-utils";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { computed, defineComponent, h } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  integrationKits,
  integrationSetups
} from "@upmind-automation/headless/testing";
import { reflect, SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import declaration from "../../../useTickets/tickets.scenario";
import { useModulePort } from "../../composables/useModulePort";
import {
  armCorpusModule,
  runtimeCorpus,
  runtimeFeature
} from "../../force/corpus";
import { createForceHandlers } from "../../force/handlers";
import { trackedModuleOf } from "../../scenario.utils";
import { ModuleRenderer } from "../index";
import { find, keys } from "lodash-es";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

// happy-dom ships no `Element.animate`; the list's auto-animate directive would
// throw out of a MutationObserver as an unhandled rejection without it.
(Element.prototype as unknown as { animate: () => unknown }).animate ??=
  () => ({
    cancel: () => undefined,
    finished: Promise.resolve(),
    addEventListener: () => undefined
  });

const settle = (ms = 400): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/** The badge the status column draws for `meta.isLocked` — label or its key. */
const LOCKED_BADGE = /Locked|text\.locked_label/;

const module = trackedModuleOf(declaration.tracks)!;
const kit = (await integrationKits[module]()) as Record<string, unknown>;
const { server } = (await integrationSetups[module]()) as {
  server: {
    use: (...handlers: unknown[]) => void;
    resetHandlers: () => void;
  };
};
await armCorpusModule(module);
const bodies = runtimeCorpus(module);
const feature = runtimeFeature(module);

const ticketsRecordingsDir = join(
  process.cwd(),
  "../..",
  "packages/headless/src/modules/tickets/__tests__/fixtures"
);

/**
 * The recorded list body with `settings.lock` toggled ON for the FIRST row
 * only. Every other field on every row is the recorded value.
 */
function listWithOneLockedRow(): Record<string, unknown> {
  const body = getFixtureBody("get-tickets-with-staged-imports-1", {
    recordingsDir: ticketsRecordingsDir
  }) as { data: Array<Record<string, unknown>> };

  return {
    ...body,
    data: body.data.map((row, index) =>
      index === 0 ? { ...row, settings: { lock: true } } : row
    )
  };
}

type BootedList = { wrapper: VueWrapper; rows: () => VueWrapper[] };

async function bootList(): Promise<BootedList> {
  const resetScopes = kit[
    find(keys(kit), key => /^reset.*Scopes?$/.test(key)) as string
  ] as () => void;
  resetScopes();
  server.resetHandlers();
  await (kit.seedClientSession as () => Promise<unknown>)();
  (kit.installBackgroundStubs as (target: unknown) => void)(server);
  server.use(...createForceHandlers("replay", bodies!, feature));
  // Registered last so it wins: the corpus answers every other read.
  server.use(
    http.get("*/api/tickets", () => HttpResponse.json(listWithOneLockedRow()))
  );

  const port = useModulePort(declaration.useList as unknown as never, {
    actor: ScopeActorTypes.CLIENT,
    offeredActors: declaration.actors
  }) as { actions: { isReady: () => Promise<unknown> } };

  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: "/:pathMatch(.*)*",
        name: "any",
        component: { render: () => null }
      }
    ]
  });
  await router.push("/useTickets");
  await router.isReady();

  const host = defineComponent({
    setup() {
      const descriptor = computed(() =>
        reflect(declaration.key, SCOPE_ACTOR.SELF, port)
      );
      return () =>
        h(ModuleRenderer, {
          descriptor: descriptor.value,
          port,
          presentation: declaration.presentation
        });
    }
  });

  const wrapper = mount(host, {
    attachTo: document.body,
    global: { plugins: [router] }
  });
  await Promise.race([port.actions.isReady(), settle(20000)]);
  await settle(600);

  return { wrapper, rows: () => wrapper.findAll('[data-test-key="row"]') };
}

// -----------------------------------------------------------------------------

describe("the ticket listing tells a hand which tickets are locked", () => {
  let booted: BootedList | undefined;

  afterEach(() => {
    booted?.wrapper.unmount();
    booted = undefined;
    document.body.innerHTML = "";
  });

  it("badges the LOCKED row and leaves an unlocked row unbadged", async () => {
    booted = await bootList();
    const rows = booted.rows();

    expect(rows.length).toBeGreaterThan(1);
    expect(rows[0]!.text()).toMatch(LOCKED_BADGE);
    // The discrimination: a flag read off a path no row carries would badge
    // NEITHER row, and one that ignored the row would badge both.
    expect(rows[1]!.text()).not.toMatch(LOCKED_BADGE);
  }, 40000);
});
