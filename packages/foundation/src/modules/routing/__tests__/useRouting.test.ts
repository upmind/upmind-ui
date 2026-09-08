/**
 * @fileoverview useRouting flow fan-out — ADR 023 §8 registerFlows
 *
 * ## Job To Be Done
 * Prove the routing socket hands the app's real router to every registered flow
 * registrar, in registration order, and that an app with no feature flows can
 * still call `register` safely.
 *
 * ## What Breaks If These Fail
 * A registrar that never receives the router leaves its funnel guards
 * unattached, so checkout navigates straight past its steps; the wrong router
 * instance attaches the guards to a router nobody navigates.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineFeature, useFeatures, useRouting } from "../../../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } =
    await import("../../../__tests__/headless.stub");
  return createHeadlessStub();
});

const Stub = defineComponent({ setup: () => () => null });

function engine() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", name: "home", component: Stub }]
  });
}

describe("useRouting", () => {
  beforeEach(() => {
    useFeatures().reset();
  });

  it("hands the given router to every registrar, in registration order", () => {
    const calledWith: unknown[] = [];
    const basketFlows = vi.fn(() => void calledWith.push("basket"));
    const invoiceFlows = vi.fn(() => void calledWith.push("invoice"));
    const router = engine();

    useFeatures().register(
      defineFeature({
        name: "basket",
        setup: ctx => ctx.registerFlows(basketFlows)
      }),
      defineFeature({
        name: "invoice",
        setup: ctx => ctx.registerFlows(invoiceFlows)
      })
    );
    useFeatures().install();
    useRouting().register(router);

    expect(calledWith).toEqual(["basket", "invoice"]);
    expect(basketFlows).toHaveBeenCalledWith(router);
    expect(invoiceFlows).toHaveBeenCalledWith(router);
  });

  it("registers with no flows without throwing", () => {
    const router = engine();

    expect(() => useRouting().register(router)).not.toThrow();
    expect(useRouting().flows.value).toEqual([]);
  });
});
