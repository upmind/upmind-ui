import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import error from "@upmind-automation/i18n/core/error-en.json";
import { ModuleStateNotice } from "../index";
import type { ModuleState } from "../module-state.types";

const nonReadyStates: Exclude<ModuleState, "ready">[] = ["loading", "error"];

const roleByState: Record<Exclude<ModuleState, "ready">, string> = {
  loading: "status",
  error: "alert"
};

/** The refusal a module publishes — an i18n KEY beside the raw envelope. */
const REFUSAL = {
  message: "error.something_went_wrong",
  code: 409,
  status: 409,
  data: []
};

const withI18n = (props: Record<string, unknown>) =>
  mount(ModuleStateNotice, {
    props,
    global: {
      plugins: [
        createI18n({ legacy: false, locale: "en", messages: { en: { error } } })
      ]
    }
  });

describe("@AC3 ModuleStateNotice — the cross-archetype non-ready-state notice", () => {
  it.each(nonReadyStates)(
    "renders the WCAG-correct role for the %s state",
    state => {
      const wrapper = mount(ModuleStateNotice, { props: { state } });

      expect(wrapper.attributes("role")).toBe(roleByState[state]);
    }
  );

  it("renders distinct content per state", () => {
    const rendered = nonReadyStates.map(state =>
      mount(ModuleStateNotice, { props: { state } }).text()
    );

    expect(new Set(rendered).size).toBe(nonReadyStates.length);
  });

  // `S14`: the API's own sentence, never the artefact it arrived in. The raw
  // envelope already has a home — the Debug sheet.
  // Negative control: `module-state-notice.envelope-dump.must-fail.patch`.
  it("says the refusal as one translated sentence, never the envelope", () => {
    const rendered = withI18n({ state: "error", detail: REFUSAL }).text();

    expect(rendered).toContain(error.something_went_wrong);
    expect(rendered).not.toContain("error.something_went_wrong");
    expect(rendered).not.toContain(String(REFUSAL.code));
    expect(rendered).not.toContain("{");
  });
});
