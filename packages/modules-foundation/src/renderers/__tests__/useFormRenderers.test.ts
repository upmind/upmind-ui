/**
 * @fileoverview useFormRenderers inject door.
 *
 * ## Job To Be Done
 * A form host reads an empty set with no provider, and its own list with one.
 *
 * ## What Breaks If These Fail
 * A host with no domain renderer cannot mount a form, or an app cannot supply its set.
 */

import { describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { readInChildOfProvider } from "../../__tests__/component-context";
import { provideFormRenderers, useFormRenderers } from "../../index";
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
