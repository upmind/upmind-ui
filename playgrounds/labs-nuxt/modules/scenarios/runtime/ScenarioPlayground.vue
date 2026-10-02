<template>
  <ScenarioArea v-if="scenario.tabs" :scenario="scenario" />
  <ScenarioPanel v-else :scenario="scenario" />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/ScenarioPlayground
 * @description THE scenario host — ONE component behind every scenario route,
 * at every scope the url names (`/:brandId?/:scenario/as/:actor/for/:type/:id`).
 * It holds no module knowledge and boots nothing: the route names the
 * scenario, and the declaration decides what is drawn — one binding as a page
 * (`ScenarioPanel`) or an area of tabbed panels (`ScenarioArea`).
 *
 * It exists as its own component because the route's page record is a file
 * (`index.ts` registers this one for every directory) and `definePageMeta`
 * belongs to the page, not to the bodies it draws.
 */

import { scenarioRouteOf, scenarioRoutes } from "./registry";
import ScenarioArea from "./ScenarioArea.vue";
import ScenarioPanel from "./ScenarioPanel.vue";
import { get } from "lodash-es";
import type { RegisteredScenario } from "./scenario.types";

// -----------------------------------------------------------------------------

definePageMeta({
  // Key by PATH, never `fullPath`: the scope segments (`/:brandId`, `/as/:actor`,
  // `/for/:type/:id`) are what the port is built from, so they must remount and
  // rebuild it — while the criteria, which task 58 persists into the QUERY
  // string, must not. A `fullPath` key ties a teardown to every filter write.
  //
  // `token` is the one query param that DOES rebuild: it is the guest link
  // identity the cell boots on (`.withId(token)`), so a change of token must
  // remount to re-address — the criteria params, which the rest of the query
  // carries, never do.
  //
  // An overlay child (`/upgrade/`, `/payment/`, `/session/`) is NOT the page's
  // path: keying on it remounted the page beneath every overlay, and that
  // unmount destroyed the very cell the overlay was drawing.
  key: route => {
    const path = route.path.replace(/\/$/, "");
    const page = route.meta.overlayId
      ? path.replace(new RegExp(`/${route.meta.overlayId}$`), "")
      : path;
    return `${page}::token=${route.query.token ?? ""}`;
  }
  // NO `name`/`path` here: `augmentPages` assigns an extracted macro name onto
  // every route sharing this file, so one declared here would collapse all
  // sixty scenario routes onto a single name.
});

const scenarioRoute = scenarioRouteOf(useRoute());
const found: RegisteredScenario | undefined = get(
  scenarioRoutes,
  scenarioRoute
);

if (!found)
  throw createError({
    statusCode: 404,
    statusMessage: `Unregistered scenario route "${scenarioRoute}"`
  });

const scenario: RegisteredScenario = found;
</script>
