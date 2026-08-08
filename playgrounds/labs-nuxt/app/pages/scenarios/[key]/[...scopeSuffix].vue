<template>
  <UpmLayout>
    <div class="space-y-8">
      <h1 class="text-display text-3xl font-bold">
        {{ startCase(scenarioKey) }}
      </h1>
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
 */

import { UpmLayout } from "@upmind-automation/client-vue";
import { createHarness } from "@upmind-automation/scenario-harness";
import { get, startCase } from "lodash-es";
import type { ScenarioKey } from "@upmind-automation/headless/scenarios";
import type { ScopeActor } from "@upmind-automation/scenario-harness";
import { ModuleRenderer } from "~/components/factory";
import { useInspector } from "~/components/inspector";
import {
  bootScenarioPort,
  registry,
  scenarioRegistry
} from "~/composables/factory/registry";
import { useActorScope, useContextScope } from "~/composables/scope";

// -----------------------------------------------------------------------------

definePageMeta({
  name: "scenario",
  // Key by fullPath so a scope change remounts: setup re-runs and the port is
  // rebuilt at the new scope (the `useAuth` page's precedent).
  key: route => route.fullPath,
  nav: { hidden: true }
});

const route = useRoute();
const scenarioKey = route.params.key as ScenarioKey;
const entry = get(registry, scenarioKey);

if (!entry)
  throw createError({
    statusCode: 404,
    statusMessage: `Unregistered scenario key "${scenarioKey}"`
  });

const actorScope = useActorScope();
const contextScope = useContextScope();

const port = bootScenarioPort(entry, {
  actor: actorScope.value,
  contextId: contextScope.value?.id
});

const harness = createHarness(scenarioRegistry);
const descriptor = computed(() =>
  harness.reflect(scenarioKey, actorScope.value as ScopeActor, port)
);

// --- Inspector debug registration
const { register } = useInspector();

register({
  key: `scenario-${scenarioKey}-${route.fullPath}`,
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
