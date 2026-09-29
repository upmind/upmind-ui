/**
 * @fileoverview The cart's startup registers every package's form controls.
 *
 * ## Job To Be Done
 * Once the cart's entry has run, the form-control registry holds the controls
 * of every package the cart depends on, before any form renders.
 *
 * ## What Breaks If These Fail
 * A product, checkout or account form draws a field with no control, because
 * the package that registers it was not loaded at startup.
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import { assign, clone } from "lodash-es";
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
  }
];

let registered: FormRendererEntry[] = [];

beforeAll(async () => {
  await import("../src/main");
  const { useFormRenderers } = await import("@upmind-automation/foundation");
  registered = clone(useFormRenderers().renderers);
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
});
