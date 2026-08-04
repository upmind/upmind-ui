import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { ModuleStateNotice } from "../index";
import type { ModuleState } from "../module-state.types";

const nonReadyStates: Exclude<ModuleState, "ready">[] = [
  "scope-invalid",
  "loading",
  "error"
];

describe("@AC3 ModuleStateNotice — the cross-archetype non-ready-state notice", () => {
  it.each(nonReadyStates)("renders an alert for the %s state", state => {
    const wrapper = mount(ModuleStateNotice, { props: { state } });

    expect(wrapper.attributes("role")).toBe("alert");
  });

  it("renders distinct content per state", () => {
    const rendered = nonReadyStates.map(state =>
      mount(ModuleStateNotice, { props: { state } }).text()
    );

    expect(new Set(rendered).size).toBe(nonReadyStates.length);
  });
});
