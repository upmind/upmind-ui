<template>
  <Page width="full">
    <div class="flex flex-col gap-4" data-test-key="scenario-area">
      <div class="flex flex-wrap items-center gap-3">
        <PageHeader class="min-w-0 flex-1" :name="scenario.route" />
        <SheetToggle />
      </div>

      <Tabs
        v-model="active"
        :tabs="items"
        :data-attrs="{ 'data-test-key': 'area-tabs' }"
      >
        <template
          v-for="tab in scenario.tabs"
          :key="tab.key"
          #[`tab.${tab.key}`]
        >
          <span class="inline-flex items-center gap-1.5">
            <Icon :icon="tab.icon" size="nano" aria-hidden="true" />
            {{ t(tab.i18n) }}
          </span>
        </template>

        <template
          v-for="tab in scenario.tabs"
          :key="tab.key"
          #[`content.${tab.key}`]
        >
          <div class="flex flex-col gap-6 pt-4">
            <ScenarioPanelFrame
              v-for="(panel, index) in tab.panels"
              :key="panel.key"
              :namespace="panel.key"
            >
              <ScenarioPanel
                :scenario="panelOf(panel.key)"
                :heading="panel.i18n ? t(panel.i18n) : undefined"
                :primary="index === 0"
                embedded
              />
            </ScenarioPanelFrame>
          </div>
        </template>
      </Tabs>
    </div>
  </Page>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/ScenarioArea
 * @description A tabbed area — one page header over a tab strip, and under the
 * active tab the panels it stacks. Each panel is the existing surface for its
 * own binding (`ScenarioPanel`), booted by the registry's flattened copy of it
 * under the harness key `<area>.<panel>`, so a panel is addressed exactly like a
 * single-surface scenario.
 *
 * Only the active tab is mounted: leaving a tab destroys its panels' cells and
 * returning boots them again, which is what keeps one tab's reads from standing
 * behind another's. The active tab rides the url as `section=<key>` — `tab` is
 * already the open sheet's section — and an unknown value lands on the first.
 */

import { Page, Tabs } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/foundation";
import { usePlaygroundUrlState } from "../../../app/composables/usePlaygroundUrlState";
import PageHeader from "./components/PageHeader.vue";
import SheetToggle from "./components/SheetToggle.vue";
import { panels } from "./registry";
import { AREA_SECTION_PARAM } from "./scenario.constants";
import { panelKeyOf } from "./scenario.utils";
import ScenarioPanel from "./ScenarioPanel.vue";
import ScenarioPanelFrame from "./ScenarioPanelFrame.vue";
import { find, first, get, map } from "lodash-es";
import type { RegisteredPanel } from "./scenario.types";
import type { ScenarioAreaProps } from "./ScenarioArea.types";
import type { TabItem } from "@upmind/ui";

// -----------------------------------------------------------------------------

const props = defineProps<ScenarioAreaProps>();

const { t } = useI18n();

const url = usePlaygroundUrlState();

const items = computed<TabItem[]>(() =>
  map(props.scenario.tabs, tab => ({
    value: tab.key,
    label: t(tab.i18n),
    dataAttrs: { "data-test-key": "area-tab", "data-test-value": tab.key }
  }))
);

const active = computed<string | undefined>({
  get: () => {
    const requested = url.params.value[AREA_SECTION_PARAM];
    return (
      find(props.scenario.tabs, tab => tab.key === requested) ??
      first(props.scenario.tabs)
    )?.key;
  },
  set: value => url.write({ [AREA_SECTION_PARAM]: value })
});

function panelOf(panel: string): RegisteredPanel {
  return get(panels, panelKeyOf(props.scenario.key, panel));
}
</script>
