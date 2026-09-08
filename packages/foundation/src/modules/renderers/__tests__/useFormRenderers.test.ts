/**
 * @fileoverview useFormRenderers inject door — ADR 023 §7 socket rule
 *
 * ## Job To Be Done
 * Prove the renderer socket has both arms. Absent a provider a form host reads
 * whatever the contributing packages registered; with `provideFormRenderers` an
 * app or a brand layer substitutes its own list and that substitution wins.
 *
 * ## What Breaks If These Fail
 * The fallback arm broken means every registered domain renderer is invisible to
 * the form host and provision fields render as raw controls. The override arm
 * broken means an app or Nuxt layer cannot swap a renderer, so §7's "injected,
 * not imported" escape hatch is gone and `catalogue` has to import `domain`.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, defineComponent, ref } from "vue";
import { readInChildOfProvider } from "../../../__tests__/component-context";
import {
  defineFeature,
  provideFormRenderers,
  useFeatures,
  useFormRenderers
} from "../../../index";
import type { FormRendererEntry } from "../../../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } =
    await import("../../../__tests__/headless.stub");
  return createHeadlessStub();
});

const Stub = defineComponent({ setup: () => () => null });

function entry(rank: number): FormRendererEntry {
  return { renderer: Stub, tester: () => rank };
}

describe("useFormRenderers", () => {
  beforeEach(() => {
    useFeatures().reset();
  });

  it("reads the registry when nothing is provided", () => {
    const registered = entry(1);

    useFeatures().register(
      defineFeature({
        name: "domain",
        setup: ctx => ctx.addRenderers([registered])
      })
    );
    useFeatures().install();

    expect(useFormRenderers().renderers.value).toEqual([registered]);
  });

  it("prefers a provided list over the registry", () => {
    const registered = entry(1);
    const provided = entry(2);

    useFeatures().register(
      defineFeature({
        name: "domain",
        setup: ctx => ctx.addRenderers([registered])
      })
    );
    useFeatures().install();

    const renderers = readInChildOfProvider(
      () => provideFormRenderers(computed(() => [provided])),
      () => useFormRenderers().renderers
    );

    expect(renderers.value).toEqual([provided]);
  });

  it("reads the provided list through, rather than snapshotting it", () => {
    const first = entry(1);
    const second = entry(2);
    const source = ref([first]);

    const renderers = readInChildOfProvider(
      () => provideFormRenderers(computed(() => source.value)),
      () => useFormRenderers().renderers
    );

    source.value = [first, second];

    expect(renderers.value).toEqual([first, second]);
  });
});
