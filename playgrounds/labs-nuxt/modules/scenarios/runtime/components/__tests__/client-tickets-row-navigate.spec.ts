// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview The listing's row 'open' control navigates to the manager
 * (FE-3226 39c489ac1)
 *
 * ## Job To Be Done
 * The ticket listing shows only a row's reference, but the manager loads by
 * uuid — so the row carries its own `open` control that NAVIGATES to
 * `/useClientTicket/as/client/for/ticket/<row id>`, the surface-owned
 * `navigate` twin of `detail`. This proves the control pushes the manager
 * route for THAT row's real uuid: two rows push two different real ids, so the
 * surface reads each row's own identity rather than a fixed target.
 *
 * ## What Breaks If These Fail
 * A hand clicks 'open' on a row and lands on the wrong ticket, or on a route
 * that never carries the id — the copy-paste-a-reference dead end the row link
 * exists to remove, arriving by way of the surface instead.
 *
 * ## Provenance
 * The rows are the `tickets` module's own committed captures, replayed through
 * the shipped force corpus behind the real `useClientTickets` — the same boot
 * `forced-surface.client-tickets` drives. Every asserted id is read off the
 * live list the recordings produced, never authored here.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { computed, defineComponent, h } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  integrationKits,
  integrationSetups
} from "@upmind-automation/headless/testing";
import { reflect, SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import declaration from "../../../useClientTickets/client-tickets.scenario";
import { useModulePort } from "../../composables/useModulePort";
import {
  armCorpusModule,
  runtimeCorpus,
  runtimeFeature
} from "../../force/corpus";
import { createForceHandlers } from "../../force/handlers";
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

const OPEN_CONTROL = "open-ticket";

// The MSW replay server needs its lifecycle hooks registered at module scope;
// booted inside a test it never intercepts and the list query never fetches.
const module = declaration.tracks as string;
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

type BootedList = {
  wrapper: VueWrapper;
  pushes: string[];
  rows: () => VueWrapper[];
  rowIds: string[];
};

async function bootList(): Promise<BootedList> {
  const resetScopes = kit[
    find(keys(kit), key => /^reset.*Scopes?$/.test(key)) as string
  ] as () => void;
  resetScopes();
  server.resetHandlers();
  await (kit.seedClientSession as () => Promise<unknown>)();
  (kit.installBackgroundStubs as (target: unknown) => void)(server);
  server.use(...createForceHandlers("replay", bodies!, feature));

  const port = useModulePort(declaration.useList as unknown as never, {
    actor: ScopeActorTypes.CLIENT,
    offeredActors: declaration.actors
  }) as {
    actions: { isReady: () => Promise<unknown> };
    useContext: () => { data: { value: Array<{ id: string }> } };
  };

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
  await router.push("/useClientTickets");
  await router.isReady();
  const pushes: string[] = [];
  const push = router.push.bind(router);
  router.push = (to: Parameters<typeof push>[0]) => {
    pushes.push(typeof to === "string" ? to : JSON.stringify(to));
    return push(to);
  };

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

  return {
    wrapper,
    pushes,
    rows: () => wrapper.findAll('[data-test-key="row"]'),
    rowIds: port.useContext().data.value.map(row => row.id)
  };
}

// -----------------------------------------------------------------------------

describe("the ticket listing links each row to its own ticket in the manager", () => {
  let booted: BootedList | undefined;

  afterEach(() => {
    booted?.wrapper.unmount();
    booted = undefined;
    document.body.innerHTML = "";
  });

  it("draws the recorded rows with an open control on each", async () => {
    booted = await bootList();

    expect(booted.rows().length).toBeGreaterThan(1);
    expect(
      booted.rows()[0]!.find(`[data-test-value="${OPEN_CONTROL}"]`).exists()
    ).toBe(true);
  });

  it("navigates a clicked row to the manager url carrying that row's own real uuid", async () => {
    booted = await bootList();
    const rows = booted.rows();

    await rows[0]!.find(`[data-test-value="${OPEN_CONTROL}"]`).trigger("click");
    await rows[1]!.find(`[data-test-value="${OPEN_CONTROL}"]`).trigger("click");

    const [firstId, secondId] = booted.rowIds;
    expect(booted.pushes).toEqual([
      `/useClientTicket/as/client/for/ticket/${firstId}`,
      `/useClientTicket/as/client/for/ticket/${secondId}`
    ]);
    // Two rows, two distinct real ids: the surface reads each row's identity,
    // not a fixed target — the failure that would let every row open one ticket.
    expect(firstId).not.toBe(secondId);
    for (const url of booted.pushes) expect(url).not.toContain("/admin/");
  });
});
