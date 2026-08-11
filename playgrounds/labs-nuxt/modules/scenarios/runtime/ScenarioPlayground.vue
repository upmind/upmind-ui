<template>
  <UpmLayout>
    <div class="space-y-8">
      <h1 class="text-display text-3xl font-bold">{{ title }}</h1>
      <FilterBar v-if="port.criteria" :criteria="port.criteria" />
      <ModuleRenderer
        :descriptor="descriptor"
        :port="port"
        :presentation="scenario.presentation"
      />
    </div>
  </UpmLayout>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/ScenarioPlayground
 * @description THE canary host — ONE component behind every scenario route,
 * at every scope the url names (`/:brandId?/:scenario/as/:actor/for/:type/:id`).
 * It holds no module knowledge: the route names the scenario, the declaration
 * boots the seam port, the harness reflects that port into the descriptor
 * `ModuleRenderer` dispatches on, and the declaration's own presentation rides
 * alongside so a surface draws what the scenario declared rather than what it
 * can sniff off a row.
 *
 * No scenario has a page file of its own, so there is nowhere for one to
 * acquire its own boot: `useModulePort(entry)` is called here, once, for all of
 * them.
 *
 * It is also the RENDERED half of "raw vs rendered": a cell that owns criteria
 * gets its own declared filter bar above the surface, and the Inspector — where
 * the raw schema · uischema · model · built wire live — overlays it on demand.
 */

import { useI18n } from "vue-i18n";
import { UpmLayout } from "@upmind-automation/client-vue";
import { createHarness } from "@upmind-automation/scenario-harness";
import { FilterBar, ModuleRenderer } from "./components";
import { useCriteriaUrlSync } from "./composables/useCriteriaUrlSync";
import { useModulePort } from "./composables/useModulePort";
import { scenarioRegistry, scenarioRoutes } from "./registry";
import { SCENARIO_ROUTE_META_KEY } from "./scenario.constants";
import { get, startCase } from "lodash-es";
import type { RegisteredScenario } from "./scenario.types";
import type { ScopeActor } from "@upmind-automation/scenario-harness";
import { useInspector } from "~/components/inspector";
import { useActorScope, useContextScope } from "~/composables/scope";

// -----------------------------------------------------------------------------

definePageMeta({
  // Key by PATH, never `fullPath`: the scope segments (`/:brandId`, `/as/:actor`,
  // `/for/:type/:id`) are what the port is built from, so they must remount and
  // rebuild it — while the criteria, which task 58 persists into the QUERY
  // string, must not. A `fullPath` key ties a teardown to every filter write.
  key: route => route.path
  // NO `name`/`path` here: `augmentPages` assigns an extracted macro name onto
  // every route sharing this file, so one declared here would collapse all
  // sixty scenario routes onto a single name.
});

const route = useRoute();
const { t } = useI18n();

const scenarioRoute = get(route.meta, SCENARIO_ROUTE_META_KEY) as string;
const scenario: RegisteredScenario | undefined = get(
  scenarioRoutes,
  scenarioRoute
);

if (!scenario)
  throw createError({
    statusCode: 404,
    statusMessage: `Unregistered scenario route "${scenarioRoute}"`
  });

const scenarioKey = scenario.key;

const title = computed(() =>
  scenario.nav ? t(scenario.nav.i18n) : startCase(scenario.route)
);

const actorScope = useActorScope();
const contextScope = useContextScope();

const port = useModulePort(scenario, {
  actor: actorScope.value,
  contextId: contextScope.value?.id
});

// --- Request state ⇄ url, when the scenario opts in
useCriteriaUrlSync(port.criteria, { enabled: scenario.persistCriteria });

const harness = createHarness(scenarioRegistry);
const descriptor = computed(() =>
  harness.reflect(scenarioKey, actorScope.value as ScopeActor, port)
);

// --- Inspector debug registration, page-scoped
const { register } = useInspector();

register({
  key: `scenario-${scenarioKey}-${route.path}`,
  factory: () => ({
    name: title.value,
    meta: port.getMeta(),
    context: descriptor.value.snapshot.context
  })
});

// --- Lifecycle
onMounted(() => {
  const isReady = get(port.actions, "isReady");
  if (isReady) isReady();
});

onUnmounted(() => {
  const destroy = get(port.actions, "destroy");
  if (destroy) destroy();
});
</script>
