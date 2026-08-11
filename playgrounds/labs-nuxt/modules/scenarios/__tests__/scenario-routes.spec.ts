// -----------------------------------------------------------------------------
/**
 * @fileoverview @G3d route registration — the module is the only thing that
 * names a scenario's url, and the scope shapes survive the move off
 * `app/pages/**` (operator, 2026-08-10: *"the routes defined must still work
 * with our `as/` and brand route params"* — NON-NEGOTIABLE).
 *
 * ## Job To Be Done
 * Under Option B nothing in `app/pages/` explains `/useClientEmails`: the route
 * exists only because a build-time registrar pushed it. Two things can go
 * silently wrong with that, both proven silent in the 4.2.2 probe behind the
 * design — a route that drops the scope catch-all takes `.for('client', id)`
 * and the brand prefix with it, and a directory that repeats an existing route
 * name produces two router records and no warning at all.
 *
 * So the registrar is driven here as Nuxt drives it, and the routes it pushes
 * are resolved through the app's OWN router options and scope parser rather
 * than pattern-matched as strings.
 *
 * ## What Breaks If These Fail
 * The canary's url stops carrying identity: `/as/:actor` and `/for/:type/:id`
 * silently no-op, which is FE-2824's failure mode arriving by way of the router
 * — or two scenarios answer to one name and one of them is unreachable.
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { parseScopeSuffix } from "../../../app/composables/scope";
import routerOptions from "../../../app/router.options";
import { SCENARIO_ROUTE_META_KEY } from "../runtime/scenario.constants";
import { registerScenarioRoutes } from "./nuxt-build-context";
import { filter, find, isArray, join as joinAll, map, uniq } from "lodash-es";
import type { NuxtPage } from "@nuxt/schema";
import type { Router } from "vue-router";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(__dirname, "..");
const PLAYGROUND = join(MODULE_DIR, "runtime/ScenarioPlayground.vue");

/** The inventory `ls modules/scenarios` gives a human, read from disk. */
const declaredDirectories = filter(
  map(
    filter(readdirSync(MODULE_DIR, { withFileTypes: true }), entry =>
      entry.isDirectory()
    ),
    entry => entry.name
  ),
  name => existsSync(join(MODULE_DIR, name, "scenario.ts"))
);

/** The canary, and the editor its rows hand off to. */
const CANARY = "useClientEmails";

let pages: NuxtPage[];
let router: Router;

const scenarioPages = () =>
  filter(pages, page => !!page.meta?.[SCENARIO_ROUTE_META_KEY]);

/** The url the app actually serves — the registrar's route under the brand prefix. */
const resolvedScope = (path: string) => {
  const { name, params } = router.resolve(path);
  const suffix = params.scopeSuffix;
  return {
    name,
    brand: params.brandIdOrOrg,
    scope: parseScopeSuffix(
      joinAll(isArray(suffix) ? suffix : [suffix ?? ""], "/")
    )
  };
};

beforeAll(async () => {
  ({ pages } = await registerScenarioRoutes());
  router = createRouter({
    history: createMemoryHistory(),
    routes: routerOptions.routes(
      map(pages, page => ({ ...page, component: { render: () => null } }))
    ) as never
  });
});

// -----------------------------------------------------------------------------

describe("@G3d the directory IS the route — nothing else names one", () => {
  it("registers one route per scenario directory and no more", () => {
    expect(map(scenarioPages(), "name").sort()).toEqual(
      [...declaredDirectories].sort()
    );
    expect(declaredDirectories.length).toBeGreaterThan(1);
  });

  it("points every scenario route at the ONE shared playground", () => {
    expect(uniq(map(scenarioPages(), "file"))).toEqual([PLAYGROUND]);
  });

  it("carries the scenario in route meta, spelled the same as the route name", () => {
    for (const page of scenarioPages()) {
      expect(page.meta?.[SCENARIO_ROUTE_META_KEY]).toBe(page.name);
    }
  });

  // The catch-all is spelled out rather than read off `SCOPE_SUFFIX_SEGMENT`:
  // an assertion against the constant the registrar builds the path from
  // cannot fail, whatever that constant is narrowed to.
  it("ends every scenario path in the scope catch-all", () => {
    for (const page of scenarioPages()) {
      expect(page.path).toBe(`/${page.name}/:scopeSuffix(.*)*`);
    }
  });
});

describe("@G3d the four scope shapes still resolve (operator: NON-NEGOTIABLE)", () => {
  it("serves the bare url, where the binding's own scope applies", () => {
    const { name, scope } = resolvedScope(`/${CANARY}`);

    expect(name).toBe(CANARY);
    expect(scope.actor).toBeUndefined();
  });

  it("serves /:page/as/:actor", () => {
    const { name, brand, scope } = resolvedScope(`/${CANARY}/as/client`);

    expect(name).toBe(CANARY);
    expect(brand).toBe("");
    expect(scope).toMatchObject({ valid: true, actor: "client" });
  });

  it("serves /:brandId/:page/as/:actor", () => {
    const { name, brand, scope } = resolvedScope(`/acme/${CANARY}/as/client`);

    expect(name).toBe(CANARY);
    expect(brand).toBe("acme");
    expect(scope).toMatchObject({ valid: true, actor: "client" });
  });

  it("serves the full path — brand, actor and the .for() retarget together", () => {
    const { name, brand, scope } = resolvedScope(
      `/acme/${CANARY}/as/user/for/client/abc-123`
    );

    expect(name).toBe(CANARY);
    expect(brand).toBe("acme");
    expect(scope).toMatchObject({
      valid: true,
      actor: "user",
      context: { type: "client", id: "abc-123" }
    });
  });

  it("keeps the retarget reachable with no brand in the url", () => {
    const { scope } = resolvedScope(`/${CANARY}/as/user/for/client/abc-123`);

    expect(scope).toMatchObject({ context: { type: "client", id: "abc-123" } });
  });
});

describe("@G3d amendment 2 — a repeated route name is a build failure, not a second record", () => {
  it("hard-fails when a page already owns a scenario's name", async () => {
    const { resolve } = await registerScenarioRoutes([
      { name: CANARY, path: `/${CANARY}`, file: "app/pages/collide.vue" }
    ]);

    await expect(resolve()).rejects.toThrow(CANARY);
  });

  it("names the offending route rather than failing anonymously", async () => {
    const { resolve } = await registerScenarioRoutes([
      { name: CANARY, path: `/${CANARY}`, file: "app/pages/collide.vue" }
    ]);

    await expect(resolve()).rejects.toThrow(/collision/i);
  });

  it("lets an unrelated page through — the guard is a gate, not a blanket", async () => {
    const { resolve, pages: withPage } = await registerScenarioRoutes([
      { name: "useAuth", path: "/useAuth/:scopeSuffix(.*)*", file: "a.vue" }
    ]);

    await expect(resolve()).resolves.toBeUndefined();
    expect(find(withPage, { name: "useAuth" })).toBeTruthy();
  });

  it("passes on the shipped tree, so the guard is not reding everything", async () => {
    const { resolve } = await registerScenarioRoutes();

    await expect(resolve()).resolves.toBeUndefined();
  });
});
