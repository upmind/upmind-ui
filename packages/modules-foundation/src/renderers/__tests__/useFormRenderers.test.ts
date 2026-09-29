/**
 * @fileoverview The form-control registry.
 *
 * ## Job To Be Done
 * A package registers its controls once, from its entry, and every form reads
 * them with no provider above it.
 *
 * ## What Breaks If These Fail
 * A form draws no domain, gateway or address control, or never sees a package
 * that registers after the form first read the list.
 */

import { describe, expect, it, vi } from "vitest";
import { computed, defineComponent } from "vue";
import { readInChildOfProvider } from "../../__tests__/component-context";
import { registerFormRenderers, useFormRenderers } from "../../index";
import { clone, concat, size } from "lodash-es";
import type { FormRendererEntry } from "../../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } = await import("../../__tests__/headless.stub");
  return createHeadlessStub();
});

const Stub = defineComponent({ setup: () => () => null });

function entry(rank: number): FormRendererEntry {
  return { renderer: Stub, tester: () => rank };
}

const provideNothing = () => undefined;

describe("the form-control registry", () => {
  it("keeps every package's controls, in the order the packages register", () => {
    const before = clone(useFormRenderers().renderers.value);
    const payment = entry(3);
    const domain = entry(4);
    const client = entry(5);

    registerFormRenderers([payment]);
    registerFormRenderers([domain, client]);

    expect(clone(useFormRenderers().renderers.value)).toEqual(
      concat(before, [payment, domain, client])
    );
  });

  it("serves the registered controls to a component with no provider", () => {
    const registered = entry(6);
    registerFormRenderers([registered]);

    const read = readInChildOfProvider(provideNothing, () =>
      clone(useFormRenderers().renderers.value)
    );

    expect(read).toContain(registered);
  });

  it("shows a reader a package that registers after it read the list", () => {
    const { renderers } = useFormRenderers();
    const count = computed(() => size(renderers.value));
    const seen = count.value;

    registerFormRenderers([entry(7)]);

    expect(count.value).toBe(seen + 1);
  });
});
