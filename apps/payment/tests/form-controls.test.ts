/**
 * @fileoverview The payment app's pay page brings payment's form controls with it.
 *
 * ## Job To Be Done
 * Once the pay route's lazy page has loaded, and before that page sets up, the
 * form-control registry holds the controls of every package the page depends on.
 *
 * ## What Breaks If These Fail
 * The payment form draws a gateway or card field with no control, because the
 * package that registers it had not loaded when the form copied the registry.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
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
  Object.assign({}, await importOriginal<typeof import("vue")>(), {
    createApp: () => inertApp
  })
);

const INVOICE_ID = "52098d3d-e409-1748-650c-31578626e347";

const PACKAGES = [
  {
    name: "payment",
    controls: async () =>
      (await import("@upmind-automation/payment")).paymentRenderers
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

// Native array calls: the payment app does not depend on lodash-es.
/** The packages this app declares whose entry registers form controls. */
function registeringDependencies(): string[] {
  const { dependencies = {} }: { dependencies?: Record<string, string> } =
    JSON.parse(readFileSync(join(APP_ROOT, "package.json"), "utf8"));
  const registering = readdirSync(join(REPO_ROOT, "packages"))
    .map(name => join(REPO_ROOT, "packages", name))
    .filter(directory => {
      const entry = join(directory, "src/index.ts");
      return (
        existsSync(entry) &&
        /^registerFormRenderers\(/m.test(readFileSync(entry, "utf8"))
      );
    });

  return registering
    .map(manifestName)
    .filter(name => name in dependencies)
    .sort();
}

let registered: FormRendererEntry[] | undefined;

beforeAll(async () => {
  await import("../src/main");
  const { paymentRoutes } = await import("../src/routes");
  const { useFormRenderers } = await import("@upmind-automation/foundation");
  const router = createRouter({
    history: createMemoryHistory(),
    routes: paymentRoutes
  });

  // beforeResolve runs once the lazy page has loaded and before it is created.
  router.beforeResolve(() => {
    registered = Array.from(useFormRenderers().renderers.value);
  });
  await router.push(`/pay/${INVOICE_ID}`);
}, 60000);

describe("the payment app once its pay page has loaded", () => {
  it("checks every package it depends on that registers controls", () => {
    expect(
      PACKAGES.map(entry => `${PACKAGE_SCOPE}${entry.name}`).sort()
    ).toEqual(registeringDependencies());
  });

  it.each(PACKAGES)(
    "holds the form controls of $name",
    async ({ controls }) => {
      const expected = await controls();

      expect(registered, "navigation never reached the pay page").toBeDefined();
      expect(expected).not.toHaveLength(0);
      expect(registered).toEqual(expect.arrayContaining(expected));
    }
  );
});
