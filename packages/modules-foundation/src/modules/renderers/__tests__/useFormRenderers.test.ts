/**
 * @fileoverview useFormRenderers inject door — ADR 023 §7 socket rule
 *
 * ## Job To Be Done
 * Prove the renderer seam has both arms. Absent a provider a form host reads an
 * empty set, which is a shipped state — `apps/auth` renders its forms with zero
 * domain renderers. With `provideFormRenderers` the host's own list is what the
 * form reads, handed through rather than copied.
 *
 * ## What Breaks If These Fail
 * The empty arm broken means a host that wants no domain renderer cannot mount a
 * form at all. The provided arm broken means an app or a brand layer cannot
 * supply its set, so §7's "injected, not imported" escape hatch is gone and
 * `catalogue` has to import `domain`.
 */

import { describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { readInChildOfProvider } from "../../../__tests__/component-context";
import { provideFormRenderers, useFormRenderers } from "../../../index";
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

const provideNothing = () => undefined;

describe("useFormRenderers", () => {
  it("reads an empty set when no host provided one", () => {
    const renderers = readInChildOfProvider(
      provideNothing,
      () => useFormRenderers().renderers
    );

    expect(renderers).toEqual([]);
  });

  it("reads the list a host provided", () => {
    const provided = entry(2);

    const renderers = readInChildOfProvider(
      () => provideFormRenderers([provided]),
      () => useFormRenderers().renderers
    );

    expect(renderers).toEqual([provided]);
  });

  it("hands the provided list through, rather than copying it", () => {
    const provided = [entry(1), entry(2)];

    const renderers = readInChildOfProvider(
      () => provideFormRenderers(provided),
      () => useFormRenderers().renderers
    );

    expect(renderers).toBe(provided);
  });
});
