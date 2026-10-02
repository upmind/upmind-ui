/**
 * @fileoverview The labs playground's startup registers every package's form controls.
 *
 * ## Job To Be Done
 * Once every plugin the playground boots with has loaded, the form-control
 * registry holds the controls of every package the app depends on, and no
 * other control, before any form renders.
 *
 * ## What Breaks If These Fail
 * A playground form draws a field with no control, because the package that
 * registers it was not loaded at startup, or a stray catch-all hides the
 * engine's notice on a field no control claims.
 */

import { createRequire, findPackageJSON } from "node:module";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { clone, differenceWith, flatten, isEqual, map } from "lodash-es";
import type { FormRendererEntry } from "@upmind-automation/foundation";

// The playground declares these packages only through client-vue, so each is
// resolved from client-vue's package, the way client-vue's entry imports it.
const importThroughClientVue = async (specifier: string) => {
  const manifest = findPackageJSON(
    "@upmind-automation/client-vue",
    import.meta.url
  );

  if (!manifest) throw new Error("The playground has no client-vue package.");

  return import(/* @vite-ignore */ createRequire(manifest).resolve(specifier));
};

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
      (await importThroughClientVue("@upmind-automation/product"))
        .productRenderers
  },
  {
    name: "client",
    controls: async () =>
      (await importThroughClientVue("@upmind-automation/client"))
        .clientRenderers
  }
];

let registered: FormRendererEntry[] = [];

beforeAll(async () => {
  vi.stubGlobal("defineNuxtPlugin", <T>(plugin: T): T => plugin);
  const plugins = import.meta.glob("../*.ts");
  await Promise.all(map(plugins, load => load()));
  const { useFormRenderers } = await import("@upmind-automation/foundation");
  registered = clone(useFormRenderers().renderers.value);
}, 60000);

describe("the labs playground after startup", () => {
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
