/**
 * @fileoverview The cart's startup registers every package's form controls.
 *
 * ## Job To Be Done
 * Once the cart's entry has run, the form-control registry holds the controls
 * of every package the cart depends on, and no other control, before any
 * form renders.
 *
 * ## What Breaks If These Fail
 * A product, checkout or account form draws a field with no control, because
 * the package that registers it was not loaded at startup, or a stray
 * catch-all hides the engine's notice on a field no control claims.
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  assign,
  clone,
  differenceWith,
  flatten,
  isEqual,
  map
} from "lodash-es";
import type { FormRendererEntry } from "@upmind-automation/foundation";

const { inertApp } = vi.hoisted(() => {
  const inertApp: () => void = new Proxy(function inert() {}, {
    get(_target, key) {
      if (key === "then") return undefined;
      return inertApp;
    },
    apply: () => inertApp
  });
  return { inertApp };
});

// The entry runs for real; only the mount is inert, so no page renders.
vi.mock("vue", async importOriginal =>
  assign({}, await importOriginal<typeof import("vue")>(), {
    createApp: () => inertApp
  })
);

const PACKAGES = [
  {
    name: "client-vue",
    controls: async () =>
      (await import("@upmind-automation/client-vue")).formRenderers
  },
  {
    name: "payment",
    controls: async () =>
      (await import("@upmind-automation/payment")).paymentRenderers
  },
  {
    name: "product",
    controls: async () =>
      (await import("@upmind-automation/product")).productRenderers
  }
];

let registered: FormRendererEntry[] = [];

beforeAll(async () => {
  await import("../src/main");
  const { useFormRenderers } = await import("@upmind-automation/foundation");
  registered = clone(useFormRenderers().renderers.value);
}, 60000);

describe("the cart after startup", () => {
  it.each(PACKAGES)(
    "holds the form controls of $name",
    async ({ controls }) => {
      const expected = await controls();

      expect(expected).not.toHaveLength(0);
      expect(registered).toEqual(expect.arrayContaining(expected));
    }
  );

  it("holds no form control that none of its packages registered", async () => {
    const expected = flatten(
      await Promise.all(map(PACKAGES, ({ controls }) => controls()))
    );

    expect(differenceWith(registered, expected, isEqual)).toEqual([]);
  });
});
