/**
 * @fileoverview The cart's startup registers every package's form controls.
 *
 * ## Job To Be Done
 * Once the cart's entry has run, the form-control registry holds foundation's
 * controls, which the cart registers itself, and the controls of every package
 * the cart depends on, and no other control, before any form renders.
 *
 * ## What Breaks If These Fail
 * A product, checkout or account form draws a field with no control, because
 * the package that registers it was not loaded at startup, or a stray
 * catch-all hides the engine's notice on a field no control claims.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  assign,
  clone,
  concat,
  differenceWith,
  filter,
  flatten,
  has,
  isEqual,
  map,
  sortBy
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

// The entry runs for real; only the mount and the platform boot are inert, so no page renders.
vi.mock("vue", async importOriginal =>
  assign({}, await importOriginal<typeof import("vue")>(), {
    createApp: () => inertApp
  })
);

const PACKAGE_SCOPE = "@upmind-automation/";

const APP_ROOT = process.cwd();
const REPO_ROOT = resolve(APP_ROOT, "..", "..");

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
  },
  {
    name: "domain",
    controls: async () =>
      (await import("@upmind-automation/domain")).domainRenderers
  }
];

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
  // init boots the platform in the background and can outlive the test file.
  const { default: upmind } = await import("@upmind-automation/headless");
  vi.spyOn(upmind, "init").mockResolvedValue();
  await import("../src/main");
  const { foundationRenderers, useFormRenderers } =
    await import("@upmind-automation/foundation");
  foundation = foundationRenderers;
  registered = clone(useFormRenderers().renderers.value);
}, 60000);

describe("the cart after startup", () => {
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

  it("holds no form control that none of its packages registered", async () => {
    const expected = concat(
      foundation,
      flatten(await Promise.all(map(PACKAGES, ({ controls }) => controls())))
    );

    expect(differenceWith(registered, expected, isEqual)).toEqual([]);
  });
});
