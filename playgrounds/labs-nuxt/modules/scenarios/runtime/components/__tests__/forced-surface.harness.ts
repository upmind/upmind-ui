// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/forced-surface.harness
 * @description FE-3113 `AC3` · `AC4` (Task K5) — what a forced preset makes the
 * PAGE do, proven on the rendered surface rather than on a returned object.
 *
 * ## Job To Be Done
 * 774 assertions passed while three of the four presets were dead in the
 * browser. Every one of them called `presetAnswer(preset, bodies, method, url)`
 * and graded the object it returned — and the `url` came off the recording the
 * cell was testing against, so `error-action` matched by construction and
 * `loading` was proven by asserting the constant it had just been handed. A
 * test that cannot fail for the reason the feature breaks is not evidence.
 *
 * So every cell here drives the chain the operator drives: the module's OWN
 * recorded corpus, armed through the shipped `createForceHandlers`, behind the
 * real four-layer composable its scenario declares, under the real
 * `ModuleRenderer`. The request comes from the surface's own behaviour — a real
 * click on a real row control — never from a url this file supplies.
 *
 * The corpus is the only source of truth for what a page may show: every value
 * a claim is graded on is lifted from the module's own recordings, so an
 * assertion cannot name a string no capture run produced.
 *
 * ## What Breaks If These Fail
 * A developer arms a preset the picker offered and the page does not move —
 * `loading` leaves the rows it already had, a refused write reports nothing, a
 * failed read draws its error above a live table — and the bug that only
 * appears in that state ships unseen, under a green suite.
 *
 * Verified this run: `force/__tests__/force-presets.conflated-error.must-fail.patch`
 * reds the error-action cell here as well as `force-presets.spec.ts`, so a
 * production change does reach this lane.
 *
 * Negative controls still OWED, developer lane (a mutant needs the source line):
 * a `loading` that marks the cache stale instead of clearing it must red the
 * loading cell; an `empty` that withholds the whole envelope instead of its rows
 * must red the empty cell; a forced row refusal drawn only once an action is
 * FIRED — or reported through the shared feedback channel instead of on the
 * record — must red the error-action cell.
 */

import { Skeleton } from "@upmind/ui";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { computed, defineComponent, h } from "vue";
import { ScopeActorTypes } from "@upmind-automation/headless";
import {
  integrationKits,
  integrationSetups
} from "@upmind-automation/headless/testing";
import errorCatalogue from "@upmind-automation/i18n/core/error-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import { reflect, SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import { CATALOGUES } from "../../../testing/rendered";
import { useModulePort } from "../../composables/useModulePort";
import {
  armCorpusModule,
  runtimeCorpus,
  runtimeFeature
} from "../../force/corpus";
import { createForceHandlers } from "../../force/handlers";
import { offeredForcedStates } from "../../force/offer";
import { presetRefusal } from "../../force/presets";
import { forcedStateRecipeId } from "../../force/states";
import { ActionPlacementTypes } from "../../scenario.types";
import { excludedTagsOf, trackedModuleOf } from "../../scenario.utils";
import { ModuleRenderer } from "../index";
import {
  filter,
  find,
  flatMap,
  get,
  includes,
  isArray,
  isEmpty,
  isPlainObject,
  isString,
  kebabCase,
  keys,
  map,
  reject,
  toUpper,
  uniq,
  values
} from "lodash-es";
import type { ForcePreset } from "../../composables/useForcedState.types";
import type { ModulePort } from "../../composables/useModulePort.types";
import type {
  CorpusBodies,
  RecordedFixture
} from "../../force/corpus.source.types";
import type { ForcedState } from "../../force/states.types";
import type { ScenarioAction, ScenarioDeclaration } from "../../scenario.types";
import type { VueWrapper } from "@vue/test-utils";

// -----------------------------------------------------------------------------

// happy-dom computes no animation and ships no `Element.animate`, so the list's
// auto-animate directive throws out of a MutationObserver — off the call stack,
// where it surfaces as an unhandled rejection rather than a failed assertion.
(Element.prototype as unknown as { animate: () => unknown }).animate ??=
  () => ({
    cancel: () => undefined,
    finished: Promise.resolve(),
    addEventListener: () => undefined
  });

// The same directive ALSO defers work on a timer that then calls
// `requestAnimationFrame`. A stub HERE cannot help: jsdom defines
// `requestAnimationFrame` for the whole of a test, so the guard never fired,
// and vitest's jsdom teardown deletes the key outright, so an unconditional
// assignment would not survive to the moment the stale timer lands either. The
// lane cuts the timer instead (`modules/scenarios/testing/component.setup.ts`).

const OVERFLOW_TRIGGER = "show-more-options";

/**
 * The criteria chrome the runtime resolves off `useX().useContext().schemas.query`
 * (`FilterBar`'s own root, `<form data-test-key="filters">`) — drawn on EVERY
 * preset regardless of what the read returns, never a function of the records
 * on screen. An untranslated multi-select option renders its raw i18n key
 * (`invoices.filter_option.status.invoice_paid`), which can contain, as a
 * plain substring, a value this module's own corpus also carries as real
 * record data (`"invoice_paid"`) — a coincidence of vocabulary, not a record
 * reaching the screen. Excluded from `witness()` for exactly that reason: a
 * substring match against this chrome is never evidence a record rendered.
 */
const FILTER_CHROME_SELECTOR = '[data-test-key="filters"]';

/**
 * The wrapper's own text with the criteria chrome's subtree removed — Vue
 * Test Utils has no "text excluding a subtree" primitive, so this clones the
 * root element and prunes the chrome node before reading `textContent`,
 * leaving the original mounted tree untouched.
 */
const textOutsideFilterChrome = (wrapper: VueWrapper<unknown>): string => {
  const clone = (wrapper.element as Element).cloneNode(true) as Element;

  clone.querySelectorAll(FILTER_CHROME_SELECTOR).forEach(node => node.remove());

  return clone.textContent ?? "";
};

/**
 * The catalogue's two competing accounts of a failed read. One notice may carry
 * a title and ONE of these; carrying both is the pile-up the operator read three
 * sentences of at once.
 */
const EXPLANATIONS = [
  errorCatalogue.something_went_wrong_text,
  errorCatalogue.request_process_failed
];

/** Long enough for a settled query to reach the DOM through Vue's scheduler. */
const RENDER_MS = 400;

/**
 * Past the display-plus-fade clock a FIRED action's row strip runs on
 * (`surfaces/RowFailure.vue`). A forced refusal raises no toast, so it has
 * nothing due to leave alongside one and must outlive that clock.
 */
const AFTER_THE_ROW_STRIP_CLOCK = 6000;

/** A mounted page over one armed preset. */
type Mounted = {
  port: ModulePort;
  wrapper: VueWrapper<unknown>;
  /** Every value the module's own recordings put on screen right now. */
  witness: () => string[];
  rows: () => number;
};

/** What the same page draws with nothing armed — the control every claim needs. */
type Live = { rows: number; witness: string[] };

const settle = (ms = RENDER_MS) =>
  new Promise(resolve => setTimeout(resolve, ms));

const isRead = (fixture: RecordedFixture) =>
  toUpper(get(fixture, ["request", "method"], "")) === "GET";

const isServedRead = (fixture: RecordedFixture) =>
  isRead(fixture) && get(fixture, ["response", "status"], 0) < 400;

const isRefusal = (fixture: RecordedFixture) =>
  get(fixture, ["response", "status"], 0) >= 400;

/** Every string leaf under a recorded body, at any depth. */
function stringLeaves(node: unknown): string[] {
  if (isString(node)) return [node];
  if (isArray(node)) return flatMap(node, stringLeaves);
  if (isPlainObject(node)) return flatMap(values(node as object), stringLeaves);

  return [];
}

/**
 * The values a page may honestly echo back: string leaves of this module's own
 * successful reads, long enough that a match is the recording rather than a
 * coincidence of the chrome around it.
 */
function recordedValues(bodies: CorpusBodies): string[] {
  return uniq(
    filter(
      flatMap(filter(values(bodies), isServedRead), fixture =>
        stringLeaves(get(fixture, ["response", "body", "data"]))
      ),
      value => value.length >= 8
    )
  );
}

/** Every sentence this module's own refusals carry. */
function refusalSentences(bodies: CorpusBodies, refused = isRefusal): string[] {
  return uniq(
    filter(
      flatMap(filter(values(bodies), refused), fixture => [
        get(fixture, ["response", "body", "error", "message"]),
        get(fixture, ["response", "body", "message"])
      ]),
      isString
    )
  );
}

/**
 * The sentences a refused WRITE carries, alone. A read's refusal answers a
 * different question, and a row marked with one says the API refused a change
 * it was never asked to make (`capabilities.types`, `refusedWrite`).
 */
const writeRefusalSentences = (bodies: CorpusBodies) =>
  refusalSentences(bodies, fixture => isRefusal(fixture) && !isRead(fixture));

/** The `data-test-value` a control carries — the kebab of its rendered label. */
const controlValue = (action: ScenarioAction) =>
  kebabCase(get(CATALOGUES, action.i18n) as string);

/**
 * The controls a ROW offers that CALL an action — never one that opens an
 * overlay, and never the collection's own header control, which fires with no
 * row and so refuses nothing the operator can see marked.
 */
const writeControls = (declaration: ScenarioDeclaration) =>
  reject(
    get(declaration, ["presentation", "actions", "elements"], []),
    action =>
      Boolean(action.handoff) ||
      Boolean(action.detail) ||
      action.placement === ActionPlacementTypes.HEADER
  );

const isDisabled = (control: { attributes: (name: string) => unknown }) =>
  control.attributes("disabled") !== undefined ||
  control.attributes("aria-disabled") === "true";

// -----------------------------------------------------------------------------

/**
 * Registers one scenario's whole forced offer as claims about the rendered
 * page — one named test per state the module's feature names and its own
 * recordings answer (the picker's offer, `offeredForcedStates`), graded on the
 * archetype it draws: rows for a list, fields and its own controls for a form.
 *
 * @param declaration the scenario the playground routes: its own composable,
 * its presentation and the `tracks` module whose recordings arm it.
 * @throws when force loads no corpus for the module, which leaves nothing to
 * prove rather than nothing to report.
 */
export async function proveForcedSurface(
  declaration: ScenarioDeclaration
): Promise<void> {
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

  if (!bodies)
    throw new Error(
      `${module}: force loaded no corpus, so no preset can be proven on its page`
    );

  // The offer is the PICKER's own (`offeredForcedStates`): the states the
  // module's feature names, answerable from its recordings — never the corpus
  // measured on its own, which offers a form an `empty` its feature never
  // claimed (client-billing-settings, 2026-09-12).
  const states = offeredForcedStates(
    feature,
    bodies,
    excludedTagsOf(declaration.tracks)
  );
  const offered = uniq(
    map(states, state => forcedStateRecipeId(state.recipe))
  ) as ForcePreset[];
  const stateFor = (preset: ForcePreset): ForcedState | undefined =>
    find(states, state => forcedStateRecipeId(state.recipe) === preset);

  // A FORM draws one record as fields, not rows: every row-count claim below
  // is the list's, and the form is graded on what it shows and on its own
  // controls instead.
  const isForm = !declaration.useList && !!declaration.useMutate;
  const recorded = recordedValues(bodies);
  const refusals = writeRefusalSentences(bodies);
  const resetScopes = kit[
    find(keys(kit), key => /^reset.*Scopes?$/.test(key)) as string
  ] as () => void;

  async function arm(preset: ForcePreset): Promise<Mounted> {
    resetScopes();
    server.resetHandlers();
    await (kit.seedClientSession as () => Promise<unknown>)();
    (kit.installBackgroundStubs as (target: unknown) => void)(server);
    // Boot LIVE first: the page must cache its real rows before a preset is
    // ARMED over them, so the arm exercises the operator's own boot→arm→reset
    // path (FE-3113). Arming before the port boots is what let this lane pass
    // green while the page was broken for want of the module's `reset` action —
    // the page never held the rows the preset had to replace.
    server.use(...createForceHandlers("replay", bodies!, feature));

    const port = useModulePort(
      (declaration.useList ?? declaration.useMutate) as never,
      {
        actor: ScopeActorTypes.CLIENT,
        offeredActors: declaration.actors
      }
    );

    // The page hands the refusal down only under the preset it belongs to
    // (`ScenarioPlayground.vue`); relaying it under any other would draw a mark
    // this preset never promised.
    const forcedRefusal =
      preset === "error-action" ? presetRefusal(bodies!) : undefined;
    const forcedState = preset === "replay" ? undefined : stateFor(preset);

    // Re-reflected on every dependency change: a descriptor built once at mount
    // freezes the page in its boot state, so every preset renders the same
    // skeleton and passes for the wrong reason.
    const host = defineComponent({
      setup() {
        const descriptor = computed(() =>
          reflect(declaration.key, SCOPE_ACTOR.SELF, port)
        );

        return () =>
          h(ModuleRenderer, {
            descriptor: descriptor.value,
            port,
            presentation: declaration.presentation,
            forcedRefusal,
            forcedState
          });
      }
    });

    const wrapper = mount(host, { attachTo: document.body });

    // The arm itself: cache the live rows, swap the transport to the preset, then
    // clear the module's OWN cache through its published `reset` — the real path
    // `useForcedState` drives (FE-3113). `replay` IS the live boot, so it arms
    // nothing further. The reset is raced: a `loading` preset never answers the
    // re-read it triggers, and the page is meant to sit on the pending state.
    if (preset !== "replay") {
      await Promise.race([
        (port.actions.isReady as () => Promise<unknown>)(),
        settle(20000)
      ]);
      server.resetHandlers();
      (kit.installBackgroundStubs as (target: unknown) => void)(server);
      server.use(...createForceHandlers(preset, bodies!, feature));
      await Promise.race([
        (port.actions.reset as () => Promise<unknown>)(),
        settle(2000)
      ]);
    }

    // Rows are the RECORDS drawn — the table's data rows or the card list's
    // items, each marked `row` — never the empty-state row the table body
    // draws in their place, nor any `<li>` the chrome around them draws.
    const rows = () => wrapper.findAll('[data-test-key="row"]').length;

    return {
      port,
      wrapper,
      rows,
      witness: () => {
        const onScreen = textOutsideFilterChrome(wrapper);

        return filter(recorded, value => includes(onScreen, value));
      }
    };
  }

  async function settled(preset: ForcePreset): Promise<Mounted> {
    const mounted = await arm(preset);

    await Promise.race([
      (mounted.port.actions.isReady as () => Promise<unknown>)(),
      settle(20000)
    ]);
    await settle();

    return mounted;
  }

  /** Measures the unforced page, then tears it down before anything is armed. */
  async function measureLive(): Promise<Live> {
    const live = await settled("replay");
    const measured = { rows: live.rows(), witness: live.witness() };

    live.wrapper.unmount();

    return measured;
  }

  /** The module's own recorded refusal sentences, as they reach the screen. */
  const marks = (mounted: Mounted) =>
    filter(refusals, sentence => includes(mounted.wrapper.text(), sentence));

  /**
   * Fires the first row control the operator can actually reach, and names it.
   * Which of a module's controls WRITES is the module's own business — a refresh
   * is offered beside a delete — so the reachable one is found by acting, never
   * by a name this file would have to keep a list of.
   */
  async function fireARowControl(mounted: Mounted): Promise<string[]> {
    const rowAt = (index: number) =>
      mounted.wrapper.findAll('[data-test-key="row"]')[index];

    const tried: string[] = [];

    for (let index = 0; index < mounted.rows(); index += 1) {
      for (const action of writeControls(declaration)) {
        const beside = rowAt(index)?.find(
          `[data-test-value="${controlValue(action)}"]`
        );

        if (!beside?.exists() || isDisabled(beside)) continue;

        await beside.trigger("click");
        tried.push(`${action.name} on row ${index}`);
        await settle(800);

        return tried;
      }

      const overflow = rowAt(index)?.find(
        `[data-test-value="${OVERFLOW_TRIGGER}"]`
      );

      if (!overflow?.exists()) continue;

      for (const action of writeControls(declaration)) {
        // Selecting an item closes the panel, so it is re-opened per candidate —
        // and never re-clicked while open, which would toggle it shut instead.
        if (!document.querySelector('[role="menu"]')) {
          await overflow.trigger("click");
          await settle(0);
        }

        const item = document.querySelector<HTMLElement>(
          `[role="menuitem"] [data-test-value="${controlValue(action)}"]`
        );

        if (!item) continue;

        item.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        tried.push(`${action.name} on row ${index}`);
        await settle(800);

        return tried;
      }
    }

    return tried;
  }

  const CLAIMS: Record<
    ForcePreset,
    (armed: Mounted, live: Live) => Promise<void> | void
  > = {
    replay: () => undefined,

    empty: (armed, live) => {
      expect(
        armed.witness(),
        `${module} keeps recorded records on screen under an armed empty`
      ).toEqual([]);
      if (!isForm)
        expect(
          armed.rows(),
          `${module} draws as many rows armed empty as it does on Live`
        ).toBeLessThan(live.rows);
      expect(
        armed.wrapper.text(),
        `${module} reports a FAILURE under an armed empty — a state with nothing in it is not a state that went wrong`
      ).not.toContain(errorCatalogue.something_went_wrong);
      expect(
        armed.wrapper.text(),
        `${module} empties the page and tells the operator nothing`
      ).toContain(text.collection_empty);
    },

    loading: armed => {
      expect(
        armed.wrapper.findAllComponents(Skeleton).length,
        `${module} draws no placeholder under an armed loading — the page marks its rows stale and shows the ones it already had`
      ).toBeGreaterThan(0);
      expect(
        armed.witness(),
        `${module} shows the records it is meant to still be loading`
      ).toEqual([]);
    },

    "error-collection": (armed, live) => {
      const onScreen = armed.wrapper.text();

      expect(
        onScreen,
        `${module} fails its read and tells the operator nothing`
      ).toContain(errorCatalogue.something_went_wrong);
      expect(
        armed.witness(),
        `${module} draws its stale rows beside its own load error`
      ).toEqual([]);
      if (!isForm)
        expect(
          armed.rows(),
          `${module} keeps a full table under a read that failed`
        ).toBeLessThan(live.rows);
      expect(
        filter(EXPLANATIONS, sentence => includes(onScreen, sentence)),
        `${module} stacks more than one explanation on one failed read — one error, one message`
      ).toHaveLength(1);
    },

    // A save held in flight: the form is on screen with its own save spinning
    // and every field taken out of reach — the state the feature means by
    // "while my save is in progress". A list has no save of its own to hold.
    "loading-action": (armed, live) => {
      expect(
        armed.witness(),
        `${module} lost its record while its save is held`
      ).toEqual(live.witness);

      const submit = armed.wrapper.find('button[type="submit"]');

      expect(submit.exists(), `${module} draws no save control to hold`).toBe(
        true
      );
      expect(
        submit.attributes("aria-busy"),
        `${module} holds a save and its save control does not spin`
      ).toBe("true");
      expect(
        map(
          filter(
            armed.wrapper.findAll("input, select, textarea"),
            field => !isDisabled(field)
          ),
          field => field.html()
        ),
        `${module} holds a save and still lets a field be edited`
      ).toEqual([]);
    },

    "error-action": async armed => {
      const before = armed.witness();

      expect(
        before,
        `${module} armed error-action over a page with no record on it — a refused write needs a row to be refused on`
      ).not.toEqual([]);
      expect(
        armed.wrapper.text(),
        `${module} fails its READ under a refusal armed for its WRITES — one is not the other`
      ).not.toContain(errorCatalogue.something_went_wrong);

      // Nothing is dispatched above this line: a forced state is the state,
      // forced, so it is on the page before anything is pressed.
      expect(
        marks(armed),
        `${module} arms error-action and draws no refusal on any row — the operator sees the same list they saw on Live, and the state exists only once they press something`
      ).not.toEqual([]);

      await settle(AFTER_THE_ROW_STRIP_CLOCK);

      expect(
        marks(armed),
        `${module} takes its forced refusal off the page on the clock a fired action's strip runs on, while the chip still reads Forced`
      ).not.toEqual([]);
      expect(
        armed.witness(),
        `${module} lost its list to the row it drew refused`
      ).toEqual(before);

      // The offer is measured off the module's recordings, never off what a
      // page exposes, so a scenario declaring no row-level write is offered
      // this state with nothing to press. The drawn state is the whole of what
      // such a page can prove; the drive below needs a control.
      if (isEmpty(writeControls(declaration))) return;

      const fired = await fireARowControl(armed);

      expect(
        armed.wrapper.text(),
        `${module} reports one refused ROW (${fired.join(", ") || "none"}) as a collection that failed to load`
      ).not.toContain(errorCatalogue.something_went_wrong);
      expect(
        armed.witness(),
        `${module} took its whole list away when one row's write was refused`
      ).toEqual(before);
    }
  };

  describe(`${module} — every preset the picker offers changes the page`, () => {
    it("offers something to prove", () => {
      expect(
        offered,
        `${module} publishes recordings and the picker offers nothing over them`
      ).not.toEqual([]);
      if (includes(offered, "error-action"))
        expect(
          refusals,
          `${module} offers error-action with no recorded sentence to refuse with`
        ).not.toEqual([]);
    });

    it("Live draws this module's own recorded records", async () => {
      const live = await measureLive();

      expect(
        live.witness,
        `${module} draws none of its recorded values on Live — every armed claim below would pass against a page that was already blank`
      ).not.toEqual([]);
      if (!isForm)
        expect(live.rows, `${module} draws no record on Live`).toBeGreaterThan(
          0
        );
    });

    it.each(offered)(
      "armed %s",
      async preset => {
        const live = await measureLive();
        const armed =
          preset === "loading" ? await arm(preset) : await settled(preset);

        if (preset === "loading") await settle(300);

        await CLAIMS[preset](armed, live);

        armed.wrapper.unmount();
      },
      40000
    );
  });
}
