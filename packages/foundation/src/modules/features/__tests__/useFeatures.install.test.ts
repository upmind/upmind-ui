/**
 * @fileoverview Feature install routes contributions into the sockets — ADR 023 §7/§8
 *
 * ## Job To Be Done
 * Prove the socket actually carries a contribution. `defineFeature`'s `ctx` is
 * the ONE contribution door foundation publishes (§8), so a renderer, a route
 * and a flow handed to it must surface on `useFormRenderers` and `useRouting`,
 * in registration order, and disappear again on `reset`.
 *
 * ## What Breaks If These Fail
 * A registry that accepts a contribution but never yields it is the FE-2824
 * shape: every gate green, zero capability. Concretely — an optional package
 * (§7 `domain`) renders nothing into the field that injects it, and a feature's
 * routes never reach the router, so its pages 404.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import {
  defineFeature,
  useFeatures,
  useFormRenderers,
  useRouting
} from "../../../index";
import type { FormRendererEntry } from "../../../index";
import type { RouteRecordRaw } from "vue-router";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } =
    await import("../../../__tests__/headless.stub");
  return createHeadlessStub();
});

const Stub = defineComponent({ setup: () => () => null });

function entry(rank: number): FormRendererEntry {
  return { renderer: Stub, tester: () => rank };
}

function route(name: string): RouteRecordRaw {
  return { path: `/${name}`, name, component: Stub };
}

describe("feature install → sockets", () => {
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

  it("puts a feature's routes on the routing registry", () => {
    const catalogueRoute = route("catalogue");

    useFeatures().register(
      defineFeature({
        name: "catalogue",
        setup: ctx => ctx.addRoutes([catalogueRoute])
      })
    );
    useFeatures().install();

    expect(useRouting().routes.value).toEqual([catalogueRoute]);
  });

  it("puts a feature's flow registrar on the routing registry", () => {
    const registrar = vi.fn();

    useFeatures().register(
      defineFeature({
        name: "basket",
        setup: ctx => ctx.registerFlows(registrar)
      })
    );
    useFeatures().install();

    expect(useRouting().flows.value).toEqual([registrar]);
  });

  it("keeps contributions from several features in registration order", () => {
    const productEntry = entry(1);
    const domainEntry = entry(2);

    useFeatures().register(
      defineFeature({
        name: "product",
        setup: ctx => {
          ctx.addRenderers([productEntry]);
          ctx.addRoutes([route("product")]);
        }
      }),
      defineFeature({
        name: "domain",
        setup: ctx => {
          ctx.addRenderers([domainEntry]);
          ctx.addRoutes([route("domain")]);
        }
      })
    );
    useFeatures().install();

    expect(useFormRenderers().renderers.value).toEqual([
      productEntry,
      domainEntry
    ]);
    expect(useRouting().routes.value.map(record => record.name)).toEqual([
      "product",
      "domain"
    ]);
  });

  it("empties both socket registries on reset", () => {
    useFeatures().register(
      defineFeature({
        name: "domain",
        setup: ctx => {
          ctx.addRenderers([entry(10)]);
          ctx.addRoutes([route("domain")]);
          ctx.registerFlows(vi.fn());
        }
      })
    );
    useFeatures().install();
    useFeatures().reset();

    expect(useFormRenderers().renderers.value).toEqual([]);
    expect(useRouting().routes.value).toEqual([]);
    expect(useRouting().flows.value).toEqual([]);
  });
});
