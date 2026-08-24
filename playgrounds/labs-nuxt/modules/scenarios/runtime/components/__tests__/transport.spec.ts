// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/__tests__/transport.spec
 * @description T4.6 — the media bar and the scrubber (`AC2.2` · `AC2.5` ·
 * `AC2.7` · `AC2.8` · `H2` · `D5`/`E10`). Four claims:
 *   1. every transport control is ICON-ONLY and keeps its name — an accessible
 *      name in the catalogue's own words, and the same words on hover through
 *      the ui `Tooltip`;
 *   2. each control asks the player for exactly the call it is named after,
 *      and offers nothing to press where there is nowhere left to go;
 *   3. the scene rail IS the ui `Stepper` (`steps[]` + a v-model index is a
 *      scrubber) — never a hand-rolled rail;
 *   4. scrubbing moves ONE number, so the surface, the Code fence and the
 *      marked Gherkin line read at the same scene, and nothing remounts.
 *
 * The three panes are stood in for here: the sheets are another lane's, and
 * what this layer owns is that the rail writes the playhead its PARENT holds
 * rather than a second one of its own.
 *
 * ## What breaks if these fail
 * An unlabelled row of glyphs nobody can name, or a scrubber that moves the
 * rail while the page it is scrubbing stays where it was.
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { Button, Stepper, Tooltip } from "@upmind/ui";
import SceneRail from "../SceneRail.vue";
import { TRANSPORT_CONTROL } from "../Transport.types";
import Transport from "../Transport.vue";
import { every, filter, get, includes, map, nth, size, trim } from "lodash-es";
import type { TransportControl } from "../Transport.types";
import type { FeatureStep } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const SCENES: FeatureStep[] = [
  { kind: "Given", text: "the collection is open for the client", line: 8 },
  { kind: "When", text: "the client filters to unverified addresses", line: 9 },
  { kind: "Then", text: "the collection holds 2 addresses", line: 10 },
  { kind: "Then", text: "the collection reports that it is filtered", line: 11 }
];

const SCENE_COUNT = size(SCENES);

const LAST_SCENE = SCENE_COUNT - 1;

const PLAYING_VARIANTS = ["primary", "secondary"];

/**
 * The controls an idle transport draws, in order. `STOP` is the media bar's own
 * exit (`R7-9`, `Transport.types.ts`) — `PAUSE` takes `PLAY`'s slot while a
 * track runs, so four are drawn either way.
 */
const IDLE_CONTROLS = [
  TRANSPORT_CONTROL.PREV,
  TRANSPORT_CONTROL.PLAY,
  TRANSPORT_CONTROL.NEXT,
  TRANSPORT_CONTROL.STOP
] as const;

const CONTROL_COUNT = size(IDLE_CONTROLS);

const NEXT_SLOT = 2;

const messages = { en: { action, labs: labsEn, text } };

const i18n = () => createI18n({ legacy: false, locale: "en", messages });

const mountTransport = (
  props: {
    playing?: boolean;
    playhead?: number;
    sceneCount?: number;
    busy?: boolean;
  } = {}
) =>
  mount(Transport, {
    attachTo: document.body,
    props: { playing: false, playhead: 1, sceneCount: SCENE_COUNT, ...props },
    global: { plugins: [i18n()] }
  });

type Wrapper = ReturnType<typeof mountTransport>;

const controls = (wrapper: Wrapper) =>
  wrapper.findAll('[data-test-key="transport-control"]');

const control = (wrapper: Wrapper, key: TransportControl) =>
  wrapper.find(`[data-test-value="${key}"]`);

/** The tooltip wrapping the nth control — one per control, in DOM order. */
const tooltipAt = (wrapper: Wrapper, index: number) =>
  nth(wrapper.findAllComponents(Tooltip), index);

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

// -----------------------------------------------------------------------------

describe("T4.6 the transport is icon-only and still named (D5 · E10)", () => {
  it("draws each control as a real ui button, never hand-rolled markup", () => {
    const wrapper = mountTransport();

    expect(size(controls(wrapper))).toBe(CONTROL_COUNT);
    expect(size(wrapper.findAllComponents(Button))).toBe(CONTROL_COUNT);
  });

  it("gives every control an accessible name and no visible word", () => {
    const wrapper = mountTransport();

    for (const button of controls(wrapper)) {
      const name = button.attributes("aria-label");

      expect(trim(name ?? "")).not.toBe("");
      expect(button.find("span.sr-only").text()).toBe(name);
      expect(trim(button.text())).toBe(name);
    }
  });

  it("names them in the catalogue's own words, never a raw key (S21)", () => {
    const wrapper = mountTransport();

    expect(
      map(controls(wrapper), button => button.attributes("aria-label"))
    ).toStrictEqual([
      get(labsEn, "transport_step_back"),
      get(labsEn, "transport_play"),
      get(labsEn, "transport_step_forward"),
      get(labsEn, "transport_stop")
    ]);
    expect(includes(wrapper.html(), "labs.")).toBe(false);
  });

  it("offers the same name on hover, through the ui Tooltip", () => {
    const wrapper = mountTransport();
    const buttons = controls(wrapper);

    expect(size(wrapper.findAllComponents(Tooltip))).toBe(size(buttons));
    for (let index = 0; index < size(buttons); index += 1) {
      const tooltip = tooltipAt(wrapper, index);

      expect(tooltip?.props("active")).toBe(true);
      expect(tooltip?.props("label")).toBe(
        nth(buttons, index)?.attributes("aria-label")
      );
    }
  });
});

describe("T4.6 each control asks for the call it is named after (AC2.5)", () => {
  it("reads step-back · play · step-forward · stop, in that order", () => {
    const wrapper = mountTransport();

    expect(
      map(controls(wrapper), button => button.attributes("data-test-value"))
    ).toStrictEqual([...IDLE_CONTROLS]);
  });

  it("emits exactly its own call when a control is pressed", async () => {
    for (const key of IDLE_CONTROLS) {
      const wrapper = mountTransport();

      await control(wrapper, key).trigger("click");

      expect(size(wrapper.emitted(key) ?? [])).toBe(1);
      expect(
        filter(TRANSPORT_CONTROL, name => Boolean(wrapper.emitted(name)))
      ).toStrictEqual([key]);
      wrapper.unmount();
    }
  });

  it("offers pause in place of play while the track is running", async () => {
    const wrapper = mountTransport({ playing: true });

    expect(control(wrapper, TRANSPORT_CONTROL.PLAY).exists()).toBe(false);
    await control(wrapper, TRANSPORT_CONTROL.PAUSE).trigger("click");

    expect(size(wrapper.emitted(TRANSPORT_CONTROL.PAUSE) ?? [])).toBe(1);
  });

  it("has nothing to step back to on a track that has not run a scene", () => {
    const wrapper = mountTransport({ playhead: -1 });

    expect(nth(wrapper.findAllComponents(Button), 0)?.props("disabled")).toBe(
      true
    );
  });

  it("has nothing to step forward to at the last scene", () => {
    const wrapper = mountTransport({ playhead: LAST_SCENE });

    expect(
      nth(wrapper.findAllComponents(Button), NEXT_SLOT)?.props("disabled")
    ).toBe(true);
  });

  it("puts the pending state on the control that was pressed (E12 · S14)", async () => {
    for (const key of IDLE_CONTROLS) {
      const wrapper = mountTransport();
      await control(wrapper, key).trigger("click");

      await wrapper.setProps({ busy: true });

      expect(
        map(wrapper.findAllComponents(Button), button =>
          button.props("loading")
        )
      ).toStrictEqual(map(IDLE_CONTROLS, name => name === key));
      wrapper.unmount();
    }
  });

  it("treats the running track as primary or secondary, never as a warning (AC2.8 · H2)", () => {
    const wrapper = mountTransport({ playing: true });

    expect(
      every(
        wrapper.findAllComponents(Button),
        button => button.props("variant") !== "warning"
      )
    ).toBe(true);
    expect(
      every(wrapper.findAllComponents(Button), button =>
        includes(PLAYING_VARIANTS, button.props("variant"))
      )
    ).toBe(true);
  });
});

// -----------------------------------------------------------------------------

let mounts: Record<string, number>;

/** The three panes, stood in for by what they all read: one number. */
const pane = (name: string, playhead: () => number) =>
  defineComponent({
    setup() {
      mounts[name] = (mounts[name] ?? 0) + 1;
      return () => h("p", { class: name }, String(playhead()));
    }
  });

function railHost(scenes: readonly FeatureStep[] = SCENES) {
  mounts = {};
  const playhead = ref(0);

  const Host = defineComponent({
    setup() {
      const panes = map(["surface", "fence", "marked"], name =>
        pane(name, () => playhead.value)
      );

      return () =>
        h("div", [
          h(SceneRail, {
            scenes,
            modelValue: playhead.value,
            "onUpdate:modelValue": (next: number) => {
              playhead.value = next;
            }
          }),
          ...map(panes, entry => h(entry))
        ]);
    }
  });

  const wrapper = mount(Host, {
    attachTo: document.body,
    global: { plugins: [i18n()] }
  });

  return {
    wrapper,
    playhead,
    model: () => wrapper.findComponent(Stepper).props("modelValue")
  };
}

describe("T4.6 the scene rail IS the ui Stepper (AC2.5)", () => {
  it("draws the real component rather than a hand-rolled rail", () => {
    const { wrapper } = railHost();

    expect(wrapper.findComponent(Stepper).exists()).toBe(true);
    expect(size(wrapper.findAllComponents(Stepper))).toBe(1);
  });

  it("gives it one step per scene", () => {
    const { wrapper } = railHost();

    expect(size(wrapper.findComponent(Stepper).props("items"))).toBe(
      SCENE_COUNT
    );
  });

  it("draws nothing to scrub for a track with no scenes", () => {
    const { wrapper } = railHost([]);

    expect(size(wrapper.findComponent(Stepper).props("items") ?? [])).toBe(0);
  });
});

describe("T4.6 scrubbing moves ONE number (AC2.7)", () => {
  it("follows the playhead its parent holds", async () => {
    const { model, playhead } = railHost();
    const atZero = model();

    playhead.value = 2;
    await nextTick();

    expect(model()).not.toBe(atZero);
  });

  it("writes a scrub back to that same number, never to one of its own", async () => {
    const measure = railHost();
    measure.playhead.value = 2;
    await nextTick();
    const atTwo = measure.model();

    const { wrapper, playhead } = railHost();
    wrapper.findComponent(Stepper).vm.$emit("update:modelValue", atTwo);
    await nextTick();

    expect(playhead.value).toBe(2);
  });

  it("moves the surface, the fence and the marked line together, with nothing remounting", async () => {
    const measure = railHost();
    measure.playhead.value = 2;
    await nextTick();
    const atTwo = measure.model();

    const { wrapper } = railHost();
    const mountedAt = { ...mounts };
    wrapper.findComponent(Stepper).vm.$emit("update:modelValue", atTwo);
    await nextTick();

    expect(
      map(["surface", "fence", "marked"], name =>
        wrapper.find(`.${name}`).text()
      )
    ).toStrictEqual(["2", "2", "2"]);
    expect(mounts).toStrictEqual(mountedAt);
  });
});
