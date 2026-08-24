import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { ModuleStateNotice } from "../index";
import type { ModuleState } from "../module-state.types";

const nonReadyStates: Exclude<ModuleState, "ready">[] = ["loading", "error"];

const roleByState: Record<Exclude<ModuleState, "ready">, string> = {
  loading: "status",
  error: "alert"
};

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
});
