import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { ContextPanel, MetaPanel } from "../index";
import { fromPairs, map } from "lodash-es";

describe("@AC3 MetaPanel — generalised-Inspector meta-flags display", () => {
  it("lists every meta flag", () => {
    const wrapper = mount(MetaPanel, {
      props: { meta: { isOn: true, hasLabel: false } }
    });

    const badges = wrapper.findAll('[data-test-key="badge"]');
    expect(badges).toHaveLength(2);
    expect(wrapper.text()).toMatch(/Is On/i);
    expect(wrapper.text()).toMatch(/Has Label/i);
  });

  /**
   * The ON/OFF encoding (operator ruling) supersedes the danger/success
   * colouring this claim used to read: a flag is drawn by its VALUE, so the
   * word-boundary problem the old encoding had — an `…invalid` key sniffed for
   * the substring `valid` — cannot arise. That is what this proves: two keys
   * whose spellings point opposite ways, whose values point the same way, read
   * the same; and the same key flips when only its value does.
   */
  it("encodes a flag by its VALUE, never by how its key is spelled", async () => {
    const wrapper = mount(MetaPanel, {
      props: { meta: { isSomethingInvalid: true, isValid: true } }
    });

    const badges = () => wrapper.findAll('[data-test-key="badge"]');

    const states = () =>
      fromPairs(
        map(badges(), badge => [
          badge.text(),
          badge.attributes("data-test-value")
        ])
      );

    expect(states()).toEqual({
      "Is Something Invalid": "on",
      "Is Valid": "on"
    });

    await wrapper.setProps({
      meta: { isSomethingInvalid: false, isValid: true }
    });

    expect(states()).toEqual({
      "Is Something Invalid": "off",
      "Is Valid": "on"
    });
    // The flags a dev scans for are the ones that are true, so ON sorts first.
    expect(map(badges(), badge => badge.text())).toEqual([
      "Is Valid",
      "Is Something Invalid"
    ]);
  });
});

describe("@AC3 ContextPanel — generalised-Inspector raw context display", () => {
  it("renders one disclosable entry per context key, keyed by that key", () => {
    const wrapper = mount(ContextPanel, {
      props: { context: { firstName: "Ada", lastName: "Lovelace" } }
    });

    const entries = wrapper.findAll('[data-test-key="accordion-item"]');

    // Keyed by the context key, so a panel drawing two entries for one key —
    // or one entry for two — cannot read as a pass.
    expect(map(entries, entry => entry.attributes("data-test-value"))).toEqual([
      "firstName",
      "lastName"
    ]);
  });
});
