<template>
  <Page width="full">
    <Page width="wide">
      <PageHeader>
        <PageTitle>{{ t("labs.app_name") }}</PageTitle>
        <PageDescription>{{ t("labs.app_description") }}</PageDescription>
      </PageHeader>

      <PageBody>
        <StatGroup :stats="metrics" :columns="3" />

        <Card size="sm" :title="t('labs.home_getting_started')">
          <List :items="gettingStarted" />
        </Card>

        <PageSection>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <Heading :level="2" size="md">
              {{ t("labs.home_composables") }}
            </Heading>
            <Input
              v-model="query"
              class="w-full sm:w-72"
              :placeholder="t('labs.home_filter_composables')"
            >
              <template #leading>
                <Icon icon="search-md" size="xs" />
              </template>
            </Input>
          </div>

          <EmptyState
            v-if="!visibleFamilies.length"
            :title="t('labs.home_nothing_matches')"
            :description="t('labs.home_nothing_matches_description')"
          >
            <template #icon>
              <Icon icon="search-md" />
            </template>
          </EmptyState>

          <div
            v-for="family in visibleFamilies"
            :key="family.name"
            class="space-y-3"
          >
            <div class="flex items-center gap-2">
              <component :is="family.icon" class="text-muted size-4" />
              <Heading :level="3" size="xs">{{ family.label }}</Heading>
              <Badge size="sm" appearance="muted">
                {{ family.entries.length }}
              </Badge>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Card
                v-for="entry in family.entries"
                :key="entry.key"
                size="sm"
                class="group"
              >
                <NuxtLink
                  :to="entry.to ?? { name: entry.route!, params: brandParams }"
                  class="flex items-start gap-4"
                >
                  <IconTile
                    size="md"
                    class="group-hover:bg-primary-muted group-hover:text-primary-muted-contrast transition-colors"
                  >
                    <component :is="entry.icon" class="size-4" />
                  </IconTile>
                  <div class="min-w-0 flex-1">
                    <Heading :level="4" size="xs">
                      {{ entry.label }}
                    </Heading>
                    <div
                      v-if="entry.tags.length"
                      class="mt-2 flex flex-wrap gap-1"
                    >
                      <Badge
                        v-for="tag in entry.tags"
                        :key="tag"
                        size="sm"
                        appearance="muted"
                      >
                        {{ tag }}
                      </Badge>
                    </div>
                  </div>
                </NuxtLink>
              </Card>
            </div>
          </div>
        </PageSection>
      </PageBody>
    </Page>
  </Page>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module pages/index
 * @description The landing surface, derived end to end from the same
 * navigation composable the sidebar reads (C17): the counts, the family
 * grouping and every link come from the scenario contract, so the mass run's
 * modules land here without this page being touched.
 *
 * Every surface is a library component: `Page` carries the width measure and
 * the header wayfinding, `StatGroup` the three derived metrics, `IconTile` the
 * entry glyph box, `EmptyState` the zero-results branch, and `Heading` the
 * display type. `entry.icon` / `family.icon` hold a lucide COMPONENT (see
 * `useNavigation.icons`), so they render through `<component :is>`.
 */

import {
  Badge,
  Card,
  EmptyState,
  Heading,
  IconTile,
  Input,
  List,
  Page,
  PageBody,
  PageDescription,
  PageHeader,
  PageSection,
  PageTitle,
  StatGroup
} from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";
import { filter, includes, isEmpty, reduce, toLower, trim } from "lodash-es";
import type { StatItem } from "@upmind/ui";
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

const { t } = useI18n();

const route = useRoute();

/**
 * Only the brand travels — the same law `layouts/default.vue`'s `toLink` holds.
 * Every page is `/:brandIdOrOrg?/…`, so a bare name drops the param and walks
 * the user out of the brand they picked; the composable cards fell through to
 * exactly that.
 */
const brandParams = computed(() =>
  route.params.brandIdOrOrg ? { brandIdOrOrg: route.params.brandIdOrOrg } : {}
);

const { composables, families } = useNavigation();

const query = ref("");

const scenarioCount = computed(() => filter(composables.value, "to").length);

const metrics = computed((): StatItem[] => [
  { label: t("labs.home_metric_composables"), value: composables.value.length },
  { label: t("labs.home_metric_families"), value: families.value.length },
  {
    label: t("labs.home_metric_scenario_covered"),
    value: scenarioCount.value
  }
]);

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
].map((title, index) => ({ value: index, title }));
</script>
