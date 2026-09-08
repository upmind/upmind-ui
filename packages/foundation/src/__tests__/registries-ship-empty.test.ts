/**
 * @fileoverview Foundation registries ship empty — ADR 023 §2 registry-ownership
 *
 * ## Job To Be Done
 * Hold the acyclic keystone. ADR 023 §2 gives `foundation` the empty typed
 * registries and the inject API only; every renderer, route and flow ENTRY
 * belongs to the contributing package's `feature.ts`. This spec reads all four
 * registries on a cold import and asserts each reports nothing.
 *
 * ## What Breaks If These Fail
 * One domain entry declared inside `foundation` creates `foundation → <domain>`,
 * and since every domain package imports `foundation` that is a real typed
 * cycle — the socket pattern (§7) stops being acyclic and `vue-tsc -b` loses the
 * DAG the whole package cut is built on.
 *
 * This file registers nothing and installs nothing, so the state it reads is the
 * shipped state; no other spec may add to it.
 */

import { describe, expect, it, vi } from "vitest";
import { useFeatures, useFormRenderers, useRouting } from "../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } = await import("./headless.stub");
  return createHeadlessStub();
});

describe("foundation registries on a cold import", () => {
  it("declares no form renderer of its own", () => {
    expect(useFormRenderers().renderers.value).toEqual([]);
  });

  it("declares no route and no flow of its own", () => {
    const { routes, flows } = useRouting();

    expect(routes.value).toEqual([]);
    expect(flows.value).toEqual([]);
  });

  it("declares no feature of its own", () => {
    const { features, names, has } = useFeatures();

    expect(features.value).toEqual([]);
    expect(names.value).toEqual([]);
    expect(has("product")).toBe(false);
  });
});
