/**
 * @fileoverview Feature install routes contributions into the socket — ADR 023 §7/§8
 *
 * ## Job To Be Done
 * Prove the socket actually carries a contribution. `defineFeature`'s `ctx` is
 * the ONE contribution door foundation publishes (§8), so a renderer handed to
 * it must surface on `useFormRenderers`, in registration order, and disappear
 * again on `reset`.
 *
 * ## What Breaks If These Fail
 * A registry that accepts a contribution but never yields it is the FE-2824
 * shape: every gate green, zero capability. Concretely — an optional package
 * (§7 `domain`) renders nothing into the field that injects it.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { defineFeature, useFeatures, useFormRenderers } from "../../../index";
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

describe("feature install → socket", () => {
  beforeEach(() => {
    useFeatures().reset();
  });

  it("puts a feature's renderers on the renderer registry", () => {
    const domainEntry = entry(10);

    useFeatures().register(
      defineFeature({
        name: "domain",
        setup: ctx => ctx.addRenderers([domainEntry])
      })
    );
    useFeatures().install();

    expect(useFormRenderers().renderers.value).toEqual([domainEntry]);
  });

  it("keeps contributions from several features in registration order", () => {
    const productEntry = entry(1);
    const domainEntry = entry(2);

    useFeatures().register(
      defineFeature({
        name: "product",
        setup: ctx => ctx.addRenderers([productEntry])
      }),
      defineFeature({
        name: "domain",
        setup: ctx => ctx.addRenderers([domainEntry])
      })
    );
    useFeatures().install();

    expect(useFormRenderers().renderers.value).toEqual([
      productEntry,
      domainEntry
    ]);
  });

  it("empties the socket registry on reset", () => {
    useFeatures().register(
      defineFeature({
        name: "domain",
        setup: ctx => ctx.addRenderers([entry(10)])
      })
    );
    useFeatures().install();
    useFeatures().reset();

    expect(useFormRenderers().renderers.value).toEqual([]);
  });
});
