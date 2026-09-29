/**
 * @fileoverview The Nuxt cart's startup registers every package's form controls.
 *
 * ## Job To Be Done
 * Once every plugin the Nuxt cart boots with has loaded, the form-control
 * registry holds the controls of every package the app depends on, before any
 * form renders.
 *
 * ## What Breaks If These Fail
 * A product, checkout or account form draws a field with no control, because
 * the package that registers it was not loaded at startup.
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import { defineNuxtPlugin } from "./nuxt.stub";
import { clone, map } from "lodash-es";
import type { FormRendererEntry } from "@upmind-automation/foundation";

vi.mock("@sentry/nuxt", () => ({}));

const PACKAGES = [
  {
    name: "client-vue",
    controls: async () =>
      (await import("@upmind-automation/client-vue")).formRenderers
  }
];

let registered: FormRendererEntry[] = [];

beforeAll(async () => {
  vi.stubGlobal("defineNuxtPlugin", defineNuxtPlugin);
  const plugins = import.meta.glob("../app/plugins/*.ts");
  await Promise.all(map(plugins, load => load()));
  const { useFormRenderers } = await import("@upmind-automation/foundation");
  registered = clone(useFormRenderers().renderers);
}, 60000);

describe("the Nuxt cart after startup", () => {
  it.each(PACKAGES)(
    "holds the form controls of $name",
    async ({ controls }) => {
      const expected = await controls();

      expect(expected).not.toHaveLength(0);
      expect(registered).toEqual(expect.arrayContaining(expected));
    }
  );
});
