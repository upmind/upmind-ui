/**
 * @fileoverview The portal's startup registers every package's form controls.
 *
 * ## Job To Be Done
 * Once every plugin the portal boots with has loaded, the form-control
 * registry holds the controls of every package the portal depends on, before
 * any form renders.
 *
 * ## What Breaks If These Fail
 * A payment or account form in the portal draws a field with no control,
 * because the package that registers it was not loaded at startup.
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import { defineNuxtPlugin } from "./support/nuxt-app-stub";
import { clone, map } from "lodash-es";
import type { FormRendererEntry } from "@upmind-automation/foundation";

const PACKAGES = [
  {
    name: "payment",
    controls: async () =>
      (await import("@upmind-automation/payment")).paymentRenderers
  },
  {
    name: "product",
    controls: async () =>
      (await import("@upmind-automation/product")).productRenderers
  },
  {
    name: "client",
    controls: async () =>
      (await import("@upmind-automation/client")).clientRenderers
  }
];

let registered: FormRendererEntry[] = [];

beforeAll(async () => {
  vi.stubGlobal("defineNuxtPlugin", defineNuxtPlugin);
  const plugins = import.meta.glob("../app/plugins/*.ts");
  await Promise.all(map(plugins, load => load()));
  const { useFormRenderers } = await import("@upmind-automation/foundation");
  registered = clone(useFormRenderers().renderers.value);
}, 60000);

describe("the portal after startup", () => {
  it.each(PACKAGES)(
    "holds the form controls of $name",
    async ({ controls }) => {
      const expected = await controls();

      expect(expected).not.toHaveLength(0);
      expect(registered).toEqual(expect.arrayContaining(expected));
    }
  );
});
