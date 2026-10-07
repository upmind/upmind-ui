/**
 * @fileoverview The portal's startup registers every package's form controls.
 *
 * ## Job To Be Done
 * Once every plugin the portal boots with has loaded, the form-control
 * registry holds foundation's controls, which the portal registers itself, and
 * the controls of every package the portal depends on, before any form renders.
 *
 * ## What Breaks If These Fail
 * A payment or account form in the portal draws a field with no control,
 * because the package that registers it was not loaded at startup.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { defineNuxtPlugin } from "./support/nuxt-app-stub";
import { clone, filter, has, map, sortBy } from "lodash-es";
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

const PACKAGE_SCOPE = "@upmind-automation/";

const APP_ROOT = process.cwd();
const REPO_ROOT = resolve(APP_ROOT, "..", "..");

function manifestName(directory: string): string {
  const { name }: { name: string } = JSON.parse(
    readFileSync(join(directory, "package.json"), "utf8")
  );
  return name;
}

/** The packages this app declares whose entry registers form controls. */
function registeringDependencies(): string[] {
  const { dependencies }: { dependencies?: Record<string, string> } =
    JSON.parse(readFileSync(join(APP_ROOT, "package.json"), "utf8"));
  const registering = filter(
    map(readdirSync(join(REPO_ROOT, "packages")), name =>
      join(REPO_ROOT, "packages", name)
    ),
    directory => {
      const entry = join(directory, "src/index.ts");
      return (
        existsSync(entry) &&
        /^registerFormRenderers\(/m.test(readFileSync(entry, "utf8"))
      );
    }
  );

  return sortBy(
    filter(map(registering, manifestName), name => has(dependencies, [name]))
  );
}

let registered: FormRendererEntry[] = [];
let foundation: FormRendererEntry[] = [];

beforeAll(async () => {
  vi.stubGlobal("defineNuxtPlugin", defineNuxtPlugin);
  const plugins = import.meta.glob("../app/plugins/*.ts");
  await Promise.all(map(plugins, load => load()));
  const { foundationRenderers, useFormRenderers } =
    await import("@upmind-automation/foundation");
  foundation = foundationRenderers;
  registered = clone(useFormRenderers().renderers.value);
}, 60000);

describe("the portal after startup", () => {
  it("checks every package it depends on that registers controls", () => {
    expect(
      sortBy(map(PACKAGES, entry => `${PACKAGE_SCOPE}${entry.name}`))
    ).toEqual(registeringDependencies());
  });

  it.each(PACKAGES)(
    "holds the form controls of $name",
    async ({ controls }) => {
      const expected = await controls();

      expect(expected).not.toHaveLength(0);
      expect(registered).toEqual(expect.arrayContaining(expected));
    }
  );

  it("holds each of foundation's controls once, registered by the app itself", () => {
    expect(foundation).not.toHaveLength(0);

    for (const entry of foundation) {
      expect(filter(registered, held => held === entry)).toHaveLength(1);
    }
  });
});
