<template>
  <UpmLayout>
    <div class="space-y-6">
      <h1 class="text-display text-3xl font-bold">{{ title }}</h1>
      <ul class="space-y-2">
        <li v-for="key in scenarioKeys" :key="key">
          <NuxtLink
            class="text-primary underline"
            :to="`/scenarios/${key}/as/${registry[key].scope.actor}`"
          >
            {{ startCase(key) }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </UpmLayout>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module pages/scenarios/index
 * @description Every key the scenario contract declares, linked at the scope
 * that contract names. Generated from the registry — a module reaching the
 * factory adds a registry entry and no page.
 */

import { UpmLayout } from "@upmind-automation/client-vue";
import { get, startCase } from "lodash-es";
import type { NavMeta } from "~/composables/useNavigation";
import { registry, scenarioKeys } from "~/composables/factory/registry";

// -----------------------------------------------------------------------------

definePageMeta({
  name: "scenarios",
  nav: {
    label: "Scenarios",
    icon: "grid-01",
    section: "Labs",
    order: 1
  }
});

const title = computed(
  () => get(useRoute().meta.nav as NavMeta | undefined, "label") ?? ""
);
</script>
