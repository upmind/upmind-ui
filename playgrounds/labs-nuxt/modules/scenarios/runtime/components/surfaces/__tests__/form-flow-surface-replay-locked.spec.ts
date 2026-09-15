// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/__tests__/form-flow-surface-replay-locked
 * @description `R6-23` on the FORM surface — a page a scenario is replaying, or
 * a forced state is armed on, is not the operator's to drive. The list surface
 * already refuses every control under `locked`; this proves the form takes the
 * operator's hand off through an `inert` region — the picture stays LIVE,
 * nothing is restyled as disabled — and says why on the region.
 *
 * ## What Breaks If This Fails
 * A replay runs while the operator can still type into the very fields the
 * scenario is filling — two hands on one form — and a forced `Errored` page
 * takes edits it can never save (2026-09-12: the billing form stayed
 * interactive under `Forced · Replay`).
 */

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import action from "@upmind-automation/i18n/core/action-en.json";
import error from "@upmind-automation/i18n/core/error-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import labsEn from "@upmind-automation/i18n/modules/labs-en.json";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { FormFlowSurface } from "../index";
import { filter, isEmpty, map } from "lodash-es";

// -----------------------------------------------------------------------------

const feedback = clientEmails.handoff?.edit?.feedback;

const schema = {
  type: "object",
  properties: { email: { type: "string", format: "email" } },
  required: ["email"]
};
const uischema = {
  type: "VerticalLayout",
  elements: [{ type: "Control", scope: "#/properties/email" }]
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages: { en: { action, error, labs: labsEn, text } }
});

function mountForm(locked: boolean) {
  const actions = { input: vi.fn(), update: vi.fn() };

  return mount(FormFlowSurface, {
    attachTo: document.body,
    global: { plugins: [i18n] },
    props: {
      snapshot: {
        actions: ["input", "update"],
        context: { schema, uischema, model: { email: "a@b.co" } },
        meta: {}
      },
      actions,
      feedback,
      locked
    }
  });
}

const isDisabled = (control: { attributes: (name: string) => unknown }) =>
  control.attributes("disabled") !== undefined ||
  control.attributes("aria-disabled") === "true";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("R6-23 locked form surface — the operator's hand off, the picture live", () => {
  it("makes the region inert, and restyles nothing as disabled", async () => {
    const wrapper = mountForm(true);
    await wrapper.vm.$nextTick();
    const region = wrapper.find('[data-test-key="form-region"]');

    expect(region.attributes("inert")).toBeDefined();
    expect(region.attributes("aria-disabled")).toBe("true");
    expect(region.attributes("data-test-value")).toBe("locked");
    expect(region.attributes("title")).toBe(labsEn.replay_locked);

    const fields = wrapper.findAll("input, select, textarea");
    const buttons = wrapper.findAll("button");

    expect(fields.length, "the form drew no field").toBeGreaterThan(0);
    expect(buttons.length, "the form drew no action").toBeGreaterThan(0);
    // A locked form is the SAME form: a replay shows the operator the form as
    // the scenario drives it, so nothing is greyed out from under them.
    expect(
      map(filter(fields, isDisabled), field => field.html()),
      "a locked form restyled a field as disabled"
    ).toEqual([]);
    expect(
      map(filter(buttons, isDisabled), button => button.text()),
      "a locked form restyled an action as disabled"
    ).toEqual([]);
  });

  it("hands the form back on Live — no inert, no reason", async () => {
    const wrapper = mountForm(false);
    await wrapper.vm.$nextTick();
    const region = wrapper.find('[data-test-key="form-region"]');

    expect(region.attributes("inert")).toBeUndefined();
    expect(region.attributes("aria-disabled")).toBeUndefined();
    expect(region.attributes("data-test-value")).toBeUndefined();
    expect(region.attributes("title")).toBeUndefined();
    expect(
      isEmpty(filter(wrapper.findAll("input, select, textarea"), isDisabled)),
      "a Live form drew a disabled field"
    ).toBe(true);
  });
});
