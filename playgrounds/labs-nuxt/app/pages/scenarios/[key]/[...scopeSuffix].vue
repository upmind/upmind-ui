<template>
  <UpmLayout>
    <div class="space-y-8">
      <h1 class="text-display text-3xl font-bold">
        {{ startCase(scenarioKey) }}
      </h1>
      <FilterBar v-if="port.criteria" :criteria="port.criteria" />
      <ModuleRenderer :descriptor="descriptor" :port="port" />
    </div>
  </UpmLayout>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module pages/scenarios/[key]/[...scopeSuffix]
 * @description The canary host: ONE page for every scenario key, at every
 * scope the URL names (`/scenarios/:key/as/:actor/for/:type/:id`). It holds no
 * module knowledge — the key resolves a binding in the scenario contract, the
 * binding boots the seam port, and the harness reflects that port into the
 * descriptor `ModuleRenderer` dispatches on.
 *
 * It is also the RENDERED half of "raw vs rendered": a cell that owns
 * criteria gets its own declared filter bar above the surface, and the
 * Inspector — where the raw schema · uischema · model · built wire live —
 * overlays it on demand, so the declaration and what it produced are read side
 * by side.
 */

import { UpmLayout } from "@upmind-automation/client-vue";
import { createHarness } from "@upmind-automation/scenario-harness";
import { get, startCase } from "lodash-es";
import type { ScenarioKey } from "@upmind-automation/headless/scenarios";
import type { ScopeActor } from "@upmind-automation/scenario-harness";
import type { ScenarioBinding } from "~/composables/factory/registry.types";
import { FilterBar, ModuleRenderer } from "~/components/factory";
import { useInspector } from "~/components/inspector";
import { registry, scenarioRegistry } from "~/composables/factory/registry";
import { useCriteriaUrlSync } from "~/composables/factory/useCriteriaUrlSync";
import { useModulePort } from "~/composables/factory/useModulePort";
import { useActorScope, useContextScope } from "~/composables/scope";

// -----------------------------------------------------------------------------

definePageMeta({
  name: "scenario",
  // Key by PATH, never `fullPath`: the scope segments (`/:brandId`, `/as/:actor`,
  // `/for/:type/:id`) are what the port is built from, so they must remount and
  // rebuild it — while the criteria, which task 58 persists into the QUERY
  // string, must not. A `fullPath` key ties a teardown to every filter write.
  key: route => route.path,
  nav: { hidden: true }
});

const route = useRoute();
const scenarioKey = route.params.key as ScenarioKey;
const entry: ScenarioBinding | undefined = get(registry, scenarioKey);

if (!entry)
  throw createError({
    statusCode: 404,
    statusMessage: `Unregistered scenario key "${scenarioKey}"`
  });

const actorScope = useActorScope();
const contextScope = useContextScope();

const port = useModulePort(entry, {
  actor: actorScope.value,
  contextId: contextScope.value?.id
});

// --- Request state ⇄ url, when the scenario opts in
useCriteriaUrlSync(port.criteria, { enabled: entry.persistCriteria });

const harness = createHarness(scenarioRegistry);
const descriptor = computed(() =>
  harness.reflect(scenarioKey, actorScope.value as ScopeActor, port)
);

// --- Inspector debug registration
const { register } = useInspector();

register({
  key: `scenario-${scenarioKey}-${route.path}`,
  factory: () => ({
    name: startCase(scenarioKey),
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
