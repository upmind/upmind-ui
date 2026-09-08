/**
 * @fileoverview useFeatures registration — ADR 023 §8 defineFeature contract
 *
 * ## Job To Be Done
 * Prove the feature ledger a Nuxt module list writes into (§9): a definition
 * built by `defineFeature` becomes visible through `useFeatures`, one name wins
 * once, every handle reads the same ledger, and `reset` returns the package to
 * its shipped empty state.
 *
 * ## What Breaks If These Fail
 * Duplicate registration double-installs a package's renderers and routes; a
 * per-call ledger loses whatever the app registered before the reader ran, so a
 * feature silently contributes nothing and the surface it owns renders blank.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineFeature, useFeatures } from "../../../index";
import type { FeatureDefinition } from "../../../index";

vi.mock("@upmind-automation/headless", async () => {
  const { createHeadlessStub } =
    await import("../../../__tests__/headless.stub");
  return createHeadlessStub();
});

function feature(name: string, setup = () => {}): FeatureDefinition {
  return defineFeature({ name, setup });
}

describe("useFeatures registration", () => {
  beforeEach(() => {
    useFeatures().reset();
  });

  it("exposes a registered feature by definition and by name", () => {
    const product = feature("product");
    const { features, names, has, register } = useFeatures();

    register(product);

    expect(features.value).toEqual([product]);
    expect(names.value).toEqual(["product"]);
    expect(has("product")).toBe(true);
  });

  it("registers several features in one call, in argument order", () => {
    const { names, register } = useFeatures();

    register(feature("product"), feature("basket"), feature("payment"));

    expect(names.value).toEqual(["product", "basket", "payment"]);
  });

  it("drops a second definition claiming a taken name, keeping the first", () => {
    const first = feature("product");
    const second = feature("product");
    const { features, register } = useFeatures();

    register(first);
    register(second);

    expect(features.value).toEqual([first]);
  });

  it("collapses the same definition passed twice in one call", () => {
    const product = feature("product");
    const { features, names, register } = useFeatures();

    register(product, product);

    expect(features.value).toHaveLength(1);
    expect(features.value[0]).toBe(product);
    expect(names.value).toEqual(["product"]);
  });

  it("keeps the first of two same-named definitions in one call", () => {
    const installed: string[] = [];
    const first = feature("product", () => installed.push("first"));
    const basket = feature("basket", () => installed.push("basket"));
    const second = feature("product", () => installed.push("second"));
    const { features, names, register, install } = useFeatures();

    register(first, basket, second);
    install();

    expect(features.value).toHaveLength(2);
    expect(features.value[0]).toBe(first);
    expect(features.value[1]).toBe(basket);
    expect(names.value).toEqual(["product", "basket"]);
    expect(installed).toEqual(["first", "basket"]);
  });

  it("reads one shared ledger across handles", () => {
    const writer = useFeatures();
    const reader = useFeatures();

    writer.register(feature("product"));

    expect(reader.names.value).toEqual(["product"]);
  });

  it("installs each feature's setup once, in registration order", () => {
    const installed: string[] = [];
    const { register, install } = useFeatures();

    register(
      feature("product", () => installed.push("product")),
      feature("basket", () => installed.push("basket"))
    );
    install();
    install();

    expect(installed).toEqual(["product", "basket"]);
  });

  it("installs a late registration without re-running an installed setup", () => {
    const installed: string[] = [];
    const { register, install } = useFeatures();

    register(feature("product", () => installed.push("product")));
    install();
    register(feature("basket", () => installed.push("basket")));
    install();

    expect(installed).toEqual(["product", "basket"]);
  });

  it("clears the ledger and the install-once record on reset", () => {
    const installed: string[] = [];
    const handle = useFeatures();

    handle.register(feature("product", () => installed.push("product")));
    handle.install();
    handle.reset();

    expect(handle.features.value).toEqual([]);
    expect(handle.has("product")).toBe(false);

    handle.register(feature("product", () => installed.push("product")));
    handle.install();

    expect(installed).toEqual(["product", "product"]);
  });
});
