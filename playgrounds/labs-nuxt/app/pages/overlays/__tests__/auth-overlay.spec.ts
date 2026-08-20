// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC7.1 @AC7.4 @R7-1 the auth overlay carries the WHOLE journey
 * plus the actor chooser its arrival needs (H5 sharpened · H9 · C4 · D2 · G12).
 *
 * ## Job To Be Done
 * Two different asks arrive at the same overlay. A page that already names its
 * actor — `/useClientEmails/as/client` — knows which session it wants, so the
 * overlay opens on that actor's journey directly. The bare page names none, and
 * `R7-1` rules that arrival must be offered the choice rather than locked to the
 * actor the page happens to declare. One overlay, one journey, two entrances:
 * the split is read off the route the funnel builds, never off a second
 * component or a second copy of a form.
 *
 * ## What is NOT claimed here
 * That `AuthJourney` logs anyone in — its tabs, forms and per-mode states are
 * `app/components/auth`'s own contract. What is proven is that the overlay
 * DELEGATES to it rather than standing up an email+password card of its own,
 * that it does so exactly once, and that it hands over the actor and the `fresh`
 * flag the route carries.
 *
 * ## What Breaks If These Fail
 * A logged-out visitor lands on the bare page and cannot proceed as anything but
 * the page's declared actor (`R7-1`); add-session silently reuses the live
 * session instead of collecting a second one; the journey forks into two copies
 * of the same form; or the modal traps the visitor with no way out.
 */

import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import * as vue from "vue";
import { defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { AuthFlowTypes, ScopeActorTypes } from "@upmind-automation/headless";
import { RadioCards } from "@upmind-automation/upmind-ui";
import { renderedStrings } from "../../../../modules/scenarios/testing/rendered";
import { AuthJourney } from "../../../components/auth";
import { authOverlayTarget } from "../../../funnels/labs";
import AuthOverlay from "../auth.vue";
import { difference, forEach, map } from "lodash-es";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

/** Nuxt's auto-imports are globals to a bare vitest module graph. */
forEach(vue, (value, key) => vi.stubGlobal(key, value));

/**
 * `definePageMeta` is the overlay's ONLY statement of its own chrome — the modal
 * and its escape hatch are declared there, not rendered by this page, so the
 * stub records the call instead of discarding it.
 */
const pageMeta: Record<string, unknown>[] = [];
vi.stubGlobal("definePageMeta", (value: Record<string, unknown>) => {
  pageMeta.push(value);
});

const PAGE = "useClientEmails";
const OVERLAY = `${PAGE}--auth`;

const blank = defineComponent({ render: () => h("div") });

/** The page the visitor asked for, carrying its own auth child — D2's shape. */
const routes = [
  { path: "/", name: "index", component: blank },
  {
    path: `/${PAGE}/:scopeSuffix(.*)*`,
    name: PAGE,
    component: blank,
    children: [{ path: "auth", name: OVERLAY, component: blank }]
  }
];

async function overlayOn(target: Record<string, unknown>) {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(target as never);
  await router.isReady();

  pageMeta.length = 0;

  const wrapper = mount(AuthOverlay as never, {
    global: { plugins: [router] }
  });

  /**
   * The actor the journey was handed at its FIRST paint, before anything the
   * overlay resolves asynchronously has settled — a journey that boots on a
   * default and corrects itself has already collected against the wrong scope.
   */
  const bootActor = journey(wrapper as VueWrapper)?.props("actor");

  await flushPromises();

  return { wrapper, router, bootActor };
}

/**
 * The overlay under the route the FUNNEL builds — the one place the
 * add-session ≠ log-in-to-proceed split is stated, so every entrance here is
 * the app's own rather than a query this spec invented. `scopeSuffix: []` is the
 * bare page `R7-1` arrives on; a populated one is a page that named its actor.
 */
const overlayAt = (scopeSuffix: string[], options: { fresh?: boolean } = {}) =>
  overlayOn(
    authOverlayTarget({ name: PAGE, params: { scopeSuffix } }, options) as never
  );

const namedBy = (actor: ScopeActorTypes) => ["as", actor];

const journeys = (wrapper: VueWrapper) =>
  wrapper.findAllComponents(AuthJourney);

const journey = (wrapper: VueWrapper) => journeys(wrapper)[0];

const choosers = (wrapper: VueWrapper) => wrapper.findAllComponents(RadioCards);

const chooserItems = (wrapper: VueWrapper) =>
  (choosers(wrapper)[0]?.props("items") ?? []) as RadioCardsItemProps[];

/** The three modes the ONE journey groups, read off the rendered tabs. */
const modes = (wrapper: VueWrapper) =>
  map(wrapper.findAll('[data-test-key="tab-item"]'), tab =>
    tab.attributes("data-test-value")
  );

/** Every form control the OVERLAY contributes over and above the journey's own. */
const controlsOutsideTheJourney = (wrapper: VueWrapper) =>
  difference(
    map(wrapper.findAll("input, textarea, select"), node => node.element),
    map(
      journey(wrapper)?.findAll("input, textarea, select") ?? [],
      node => node.element
    )
  );

async function pick(wrapper: VueWrapper, actor: ScopeActorTypes) {
  await wrapper
    .find(`[data-test-value="${actor}"] [role="radio"]`)
    .trigger("click");
  await flushPromises();
  return wrapper;
}

// -----------------------------------------------------------------------------

describe("@AC7.4 the overlay IS the whole AuthJourney (H5 sharpened)", () => {
  it("collects the login through the playground's ONE journey, never a card of its own", async () => {
    const { wrapper } = await overlayAt(namedBy(ScopeActorTypes.CLIENT));

    expect(journeys(wrapper)).toHaveLength(1);
    expect(controlsOutsideTheJourney(wrapper)).toEqual([]);
  });

  it("carries login, register and recover as that one journey's three modes", async () => {
    const { wrapper } = await overlayAt(namedBy(ScopeActorTypes.CLIENT));

    expect(modes(wrapper)).toEqual([
      AuthFlowTypes.LOGIN,
      AuthFlowTypes.REGISTER,
      AuthFlowTypes.RECOVER
    ]);
    expect(journeys(wrapper)).toHaveLength(1);
  });
});

describe("@AC7.1 a page that NAMES its actor opens that actor's journey directly", () => {
  it("hands the route's own actor over, with no chooser in front of it", async () => {
    const { wrapper } = await overlayAt(namedBy(ScopeActorTypes.STAFF));

    expect(choosers(wrapper)).toHaveLength(0);
    expect(journey(wrapper)?.props("actor")).toBe(ScopeActorTypes.STAFF);
  });

  it("hands it over on the FIRST paint, never a default it corrects later", async () => {
    const { bootActor, wrapper } = await overlayAt(
      namedBy(ScopeActorTypes.STAFF)
    );

    expect(bootActor).toBe(ScopeActorTypes.STAFF);
    expect(journey(wrapper)?.props("actor")).toBe(bootActor);
  });

  it("hands `fresh` over, so add-session collects BESIDE the live session", async () => {
    const gate = await overlayAt(namedBy(ScopeActorTypes.CLIENT));
    const added = await overlayAt(namedBy(ScopeActorTypes.CLIENT), {
      fresh: true
    });

    expect(journey(gate.wrapper)?.props("fresh")).toBe(false);
    expect(journey(added.wrapper)?.props("fresh")).toBe(true);
  });
});

describe("@R7-1 the bare page's arrival is OFFERED the actor, never locked to one", () => {
  it("offers client, staff and guest as the one chooser", async () => {
    const { wrapper } = await overlayAt([]);

    expect(choosers(wrapper)).toHaveLength(1);
    expect(map(chooserItems(wrapper), "value")).toEqual([
      ScopeActorTypes.CLIENT,
      ScopeActorTypes.STAFF,
      ScopeActorTypes.GUEST
    ]);
  });

  it("picking staff retargets THAT journey, in the same overlay", async () => {
    const { wrapper, router } = await overlayAt([]);
    const arrivedAt = router.currentRoute.value.fullPath;

    expect(journey(wrapper)?.props("actor")).toBe(ScopeActorTypes.CLIENT);

    await pick(wrapper, ScopeActorTypes.STAFF);

    expect(journey(wrapper)?.props("actor")).toBe(ScopeActorTypes.STAFF);
    expect(journeys(wrapper)).toHaveLength(1);
    expect(router.currentRoute.value.fullPath).toBe(arrivedAt);
  });

  it("sits as three plain cards, with no explanatory sentence of any kind", async () => {
    const { wrapper } = await overlayAt([]);
    const chooser = choosers(wrapper)[0] as VueWrapper;

    expect(chooser.findAll("p")).toHaveLength(0);
    // `renderedStrings` also sweeps `aria-label`, and each radio's accessible
    // name is its raw actor value — the only strings here beyond the labels.
    expect(
      difference(renderedStrings(chooser), [
        ...map(chooserItems(wrapper), "label"),
        ...map(chooserItems(wrapper), "value")
      ])
    ).toEqual([]);
    expect(
      map(chooserItems(wrapper), item => [
        item.description,
        item.secondaryLabel,
        item.secondaryDescription,
        item.badge,
        item.action
      ])
    ).toEqual([
      [undefined, undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, undefined],
      [undefined, undefined, undefined, undefined, undefined]
    ]);
  });
});

describe("@D2 @C4 the overlay declares its own chrome", () => {
  it("is a modal the visitor can always leave", async () => {
    await overlayAt(namedBy(ScopeActorTypes.CLIENT));

    expect(pageMeta).toHaveLength(1);
    expect(pageMeta[0]).toMatchObject({ overlay: "modal", dismissable: true });
  });
});
