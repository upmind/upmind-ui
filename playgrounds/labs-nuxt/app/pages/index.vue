<template>
  <UpmLayout>
    <div class="space-y-10">
      <header class="space-y-4">
        <div>
          <h1 class="text-display text-3xl font-bold">Upmind Labs</h1>
          <p class="text-muted mt-2 max-w-3xl text-base">
            Every composable this playground can drive, derived from the
            scenario contract. A module reaching the factory as a registry entry
            appears here and in the sidebar on its own.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Badge
            variant="minimal"
            icon="code-browser"
            :label="`${composables.length} composables`"
          />
          <Badge
            variant="minimal"
            icon="layers-three-01"
            :label="`${families.length} families`"
          />
          <Badge
            variant="minimal"
            icon="beaker-01"
            :label="`${scenarioCount} scenario-covered`"
          />
        </div>
      </header>

      <Card size="sm" class="space-y-4">
        <h2 class="text-display text-2xl font-semibold">Getting Started</h2>
        <List :items="gettingStarted" />
      </Card>

      <section class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <h2 class="text-display text-2xl font-semibold">Composables</h2>
          <Input
            v-model="query"
            class="w-full sm:w-72"
            icon="search-md"
            placeholder="Filter composables"
          />
        </div>

        <Alert
          v-if="!visibleFamilies.length"
          variant="minimal"
          color="info"
          icon="search-md"
          title="Nothing matches"
          description="No composable matches that filter. Clear it to see them all."
        />

        <div
          v-for="family in visibleFamilies"
          :key="family.name"
          class="space-y-3"
        >
          <div class="flex items-center gap-2">
            <Icon :icon="family.icon" size="xs" class="text-muted" />
            <h3 class="text-display font-medium">{{ family.label }}</h3>
            <Badge
              size="sm"
              variant="minimal"
              :label="String(family.entries.length)"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <NuxtLink
              v-for="entry in family.entries"
              :key="entry.key"
              :to="entry.to ?? { name: entry.route! }"
              class="bg-surface border-surface hover:border-accent-primary card-radius group flex items-start gap-4 border p-4 transition-all hover:shadow-md"
            >
              <div
                class="bg-canvas text-muted group-hover:bg-accent-primary-muted group-hover:text-accent-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors"
              >
                <Icon :icon="entry.icon" size="sm" />
              </div>
              <div class="min-w-0 space-y-2">
                <h4 class="text-display truncate font-medium">
                  {{ entry.label }}
                </h4>
                <div v-if="entry.tags.length" class="flex flex-wrap gap-1">
                  <Badge
                    v-for="tag in entry.tags"
                    :key="tag"
                    size="sm"
                    variant="minimal"
                    color="neutral"
                    :label="tag"
                  />
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </UpmLayout>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module pages/index
 * @description The landing surface, derived end to end from the same
 * navigation composable the sidebar reads (C17): the counts, the family
 * grouping and every link come from the scenario contract, so the mass run's
 * modules land here without this page being touched.
 */

import { UpmLayout } from "@upmind-automation/client-vue";
import {
  Alert,
  Badge,
  Card,
  Icon,
  Input,
  List
} from "@upmind-automation/upmind-ui";
import { filter, includes, isEmpty, reduce, toLower, trim } from "lodash-es";
import type { LabFamily } from "~/composables/useNavigation.types";
import { useNavigation } from "~/composables/useNavigation";

// -----------------------------------------------------------------------------

definePageMeta({
  name: "home",
  nav: {
    label: "Home",
    icon: "home-01",
    section: "Composables",
    order: 0,
    hidden: true
  }
});

const { composables, families } = useNavigation();

const query = ref("");

const scenarioCount = computed(() => filter(composables.value, "to").length);

const visibleFamilies = computed((): LabFamily[] => {
  const needle = toLower(trim(query.value));
  if (!needle) return families.value;

  return reduce(
    families.value,
    (visible: LabFamily[], family) => {
      const entries = filter(family.entries, entry =>
        includes(toLower(`${entry.label} ${entry.key}`), needle)
      );
      if (!isEmpty(entries)) visible.push({ ...family, entries });
      return visible;
    },
    []
  );
});

const gettingStarted = [
  "Every composable opens at the scope its scenario declares — retarget it from the header, or in the url: /:scenario/as/:actor/for/:type/:id",
  "The Inspector, top right, holds the raw schema, uischema, model and built wire beside the rendered surface.",
  "Nothing here is hand-listed: declaring a scenario in the registry adds it to this page and to the sidebar."
];
</script>
