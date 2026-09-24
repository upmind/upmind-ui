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
 * The client-emails page's url stops carrying identity: `/as/:actor` and `/for/:type/:id`
 * silently no-op, which is FE-2824's failure mode arriving by way of the router
 * — or two scenarios answer to one name and one of them is unreachable.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { parseScopeSuffix } from "../../../app/composables/scope";
import routerOptions from "../../../app/router.options";
import { SCENARIO_ROUTE_META_KEY } from "../runtime/scenario.constants";
import { registerScenarioRoutes } from "./nuxt-build-context";
import {
  filter,
  find,
  isArray,
  join as joinAll,
  isEmpty,
  map,
  some,
  uniq
} from "lodash-es";
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
  // The declaration is named for the MODULE it declares (`R6-27`), so the
  // inventory is "a directory holding one", never a fixed filename.
  name =>
    some(readdirSync(join(MODULE_DIR, name)), file =>
      file.endsWith(".scenario.ts")
    )
);

/**
 * The route params a directory's declaration carries (`params: ["oid"]`),
 * scanned off its source exactly as the registrar scans it — the registrar
 * runs where the declaration cannot be imported, and this spec must read the
 * same literal, not a resolved module.
 */
function declaredParamsOf(name: string): string[] {
  const file = find(readdirSync(join(MODULE_DIR, name)), entry =>
    entry.endsWith(".scenario.ts")
  );
  const match = file
    ? readFileSync(join(MODULE_DIR, name, file), "utf-8").match(
        /params\s*:\s*\[([^\]]*)\]/
      )
    : null;
  return match
    ? map([...match[1]!.matchAll(/["']([^"']+)["']/g)], hit => hit[1]!)
    : [];
}

/**
 * The page a module draws itself with, when it ships one — the same file the
 * registrar switches on. A module without one is drawn by the shared
 * playground, and both routes are registered identically otherwise.
 */
const ownPageOf = (directory: string): string | undefined => {
  const own = find(readdirSync(join(MODULE_DIR, directory)), file =>
    file.endsWith(".page.vue")
  );
  return own && join(MODULE_DIR, directory, own);
};

/** The client-emails page, and the editor its rows hand off to. */
const CLIENT_EMAILS = "useClientEmails";

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
    expect(declaredDirectories.length).toBeGreaterThan(0);
  });

  it("draws every scenario with the shared playground, or with the module's own page", () => {
    for (const page of scenarioPages()) {
      expect(page.file).toBe(ownPageOf(page.name as string) ?? PLAYGROUND);
    }
  });

  // The switch is the FILE existing, never a flag: the registrar runs in the
  // Node/jiti context and may not import a declaration to read one off it.
  it("keeps the shared playground for every module that ships no page", () => {
    const shared = filter(
      scenarioPages(),
      page => !ownPageOf(page.name as string)
    );

    expect(uniq(map(shared, "file"))).toEqual([PLAYGROUND]);
    expect(shared.length).toBeGreaterThan(0);
  });

  it("carries the scenario in route meta, spelled the same as the route name", () => {
    for (const page of scenarioPages()) {
      expect(page.meta?.[SCENARIO_ROUTE_META_KEY]).toBe(page.name);
    }
  });

  // The catch-all is spelled out rather than read off `SCOPE_SUFFIX_SEGMENT`:
  // an assertion against the constant the registrar builds the path from
  // cannot fail, whatever that constant is narrowed to.
  it("ends every scenario path in the scope catch-all, after any params the declaration carries", () => {
    for (const page of scenarioPages()) {
      // `params: ["oid"]` puts `/:oid` between the directory and the catch-all
      // (`/useInvoice/:oid/:scopeSuffix(.*)*`) — an emailed link carries the id
      // in the path. A declaration with none keeps the bare shape.
      const params = joinAll(
        map(declaredParamsOf(page.name as string), p => `/:${p}`),
        ""
      );
      expect(page.path).toBe(`/${page.name}${params}/:scopeSuffix(.*)*`);
    }
  });

  it("only a declaration that names params gets an id segment", () => {
    for (const page of scenarioPages()) {
      // Read against the declaration's OWN param names. Pinning the literal
      // `/:oid` held only while `useInvoice` was the single page declaring
      // any; `useTicket` declares `id`, and a route carrying it would
      // have read as "no params at all".
      const declared = declaredParamsOf(page.name as string);
      const segments = filter(
        map(declared, p => `/:${p}`),
        segment => page.path.includes(segment)
      );

      expect(segments.length).toBe(declared.length);
      // A param may be OPTIONAL and PATTERNED (`params: ["id([0-9a-f-]{36})?"]`
      // — the bare url is a picker state, and the scope suffix follows), so the
      // segment reads `/:id(<pattern>)?/` as well as `/:oid/`.
      expect(/\/:[A-Za-z]+(\([^)]*\))?\??\//.test(page.path)).toBe(
        !isEmpty(declared)
      );
    }
  });
});

describe("@G3d the four scope shapes still resolve (operator: NON-NEGOTIABLE)", () => {
  it("serves the bare url, where the binding's own scope applies", () => {
    const { name, scope } = resolvedScope(`/${CLIENT_EMAILS}`);

    expect(name).toBe(CLIENT_EMAILS);
    expect(scope.actor).toBeUndefined();
  });

  it("serves /:page/as/:actor", () => {
    const { name, brand, scope } = resolvedScope(`/${CLIENT_EMAILS}/as/client`);

    expect(name).toBe(CLIENT_EMAILS);
    expect(brand).toBe("");
    expect(scope).toMatchObject({ valid: true, actor: "client" });
  });

  it("serves /:brandId/:page/as/:actor", () => {
    const { name, brand, scope } = resolvedScope(
      `/acme/${CLIENT_EMAILS}/as/client`
    );

    expect(name).toBe(CLIENT_EMAILS);
    expect(brand).toBe("acme");
    expect(scope).toMatchObject({ valid: true, actor: "client" });
  });

  it("serves the full path — brand, actor and the .for() retarget together", () => {
    const { name, brand, scope } = resolvedScope(
      `/acme/${CLIENT_EMAILS}/as/user/for/client/abc-123`
    );

    expect(name).toBe(CLIENT_EMAILS);
    expect(brand).toBe("acme");
    expect(scope).toMatchObject({
      valid: true,
      actor: "user",
      context: { type: "client", id: "abc-123" }
    });
  });

  it("keeps the retarget reachable with no brand in the url", () => {
    const { scope } = resolvedScope(
      `/${CLIENT_EMAILS}/as/user/for/client/abc-123`
    );

    expect(scope).toMatchObject({ context: { type: "client", id: "abc-123" } });
  });
});

describe("@G3d amendment 2 — a repeated route name is a build failure, not a second record", () => {
  it("hard-fails when a page already owns a scenario's name", async () => {
    const { resolve } = await registerScenarioRoutes([
      {
        name: CLIENT_EMAILS,
        path: `/${CLIENT_EMAILS}`,
        file: "app/pages/collide.vue"
      }
    ]);

    await expect(resolve()).rejects.toThrow(CLIENT_EMAILS);
  });

  it("names the offending route rather than failing anonymously", async () => {
    const { resolve } = await registerScenarioRoutes([
      {
        name: CLIENT_EMAILS,
        path: `/${CLIENT_EMAILS}`,
        file: "app/pages/collide.vue"
      }
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
