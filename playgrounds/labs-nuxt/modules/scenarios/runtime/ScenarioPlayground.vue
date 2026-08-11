<template>
  <UpmLayout>
    <div class="space-y-8">
      <h1 class="text-display text-3xl font-bold">{{ scenario.route }}</h1>
      <ModuleRenderer
        :descriptor="descriptor"
        :port="port"
        :presentation="scenario.presentation"
        :handoffs="handoffs"
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
 * gets its own declared filter bar inside the surface's toolbar, and the
 * Inspector — where the raw schema · uischema · model · built wire live —
 * overlays it on demand.
 */

import { UpmLayout } from "@upmind-automation/client-vue";
import { createHarness } from "@upmind-automation/scenario-harness";
import { ModuleRenderer } from "./components";
import { useCriteriaUrlSync } from "./composables/useCriteriaUrlSync";
import { useModulePort } from "./composables/useModulePort";
import { registry, scenarioRegistry, scenarioRoutes } from "./registry";
import { SCENARIO_ROUTE_META_KEY } from "./scenario.constants";
import { get, isNil, mapValues, omitBy } from "lodash-es";
import type { RegisteredScenario, ResolvedHandoff } from "./scenario.types";
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

const actorScope = useActorScope();
const contextScope = useContextScope();

// The registry is read HERE and nowhere below: a surface opens the target it
// was handed. A handoff naming a scenario nobody registered resolves to
// nothing, so its control is never offered rather than offered and dead.
const handoffs = computed(
  () =>
    omitBy(
      mapValues(scenario.handoff ?? {}, handoff => {
        const target = get(registry, handoff.target);
        return target
          ? {
              scenario: target,
              actor: actorScope.value,
              contextFrom: handoff.contextFrom
            }
          : undefined;
      }),
      isNil
    ) as Record<string, ResolvedHandoff>
);

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
    name: scenario.route,
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
