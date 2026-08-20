import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import { Button } from "@upmind-automation/upmind-ui";
import Transport from "../Transport.vue";
import { map, size } from "lodash-es";

const messages = { en: { action, labs: labsEn, text } };
const i18n = () => createI18n({ legacy: false, locale: "en", messages });

const mountTransport = (props: Record<string, unknown> = {}) =>
  mount(Transport, {
    attachTo: document.body,
    props: { playing: false, playhead: 1, sceneCount: 4, ...props },
    global: { plugins: [i18n()] }
  });

describe("probe", () => {
  it("dumps transport surface", async () => {
    for (const props of [
      { playing: false, playhead: 1 },
      { playing: true, playhead: 1 },
      { playing: false, playhead: -1 },
      { playing: false, playhead: 3 },
      { playing: false, playhead: 1, busy: true }
    ]) {
      const wrapper = mountTransport(props);
      const controls = wrapper.findAll('[data-test-key="transport-control"]');
      const buttons = wrapper.findAllComponents(Button);

      console.log(
        "PROPS",
        JSON.stringify(props),
        "controlCount",
        size(controls),
        "buttonCount",
        size(buttons)
      );
      console.log(
        "  keys   ",
        JSON.stringify(map(controls, c => c.attributes("data-test-value")))
      );
      console.log(
        "  labels ",
        JSON.stringify(map(controls, c => c.attributes("aria-label")))
      );
      console.log(
        "  disabled",
        JSON.stringify(map(buttons, b => b.props("disabled"))),
        "loading",
        JSON.stringify(map(buttons, b => b.props("loading"))),
        "color",
        JSON.stringify(map(buttons, b => b.props("color")))
      );
      wrapper.unmount();
    }
    console.log(
      "LABS KEYS",
      JSON.stringify(Object.keys(labsEn).filter(k => k.startsWith("transport")))
    );

    for (const key of ["prev", "play", "next", "stop"]) {
      const wrapper = mountTransport();
      await wrapper.find(`[data-test-value="${key}"]`).trigger("click");
      await wrapper.setProps({ busy: true });
      console.log(
        "BUSY after pressing",
        key,
        JSON.stringify(
          map(wrapper.findAllComponents(Button), b => b.props("loading"))
        ),
        "emitted",
        JSON.stringify(Object.keys(wrapper.emitted()))
      );
      wrapper.unmount();
    }
    expect(true).toBe(true);
  });
});
