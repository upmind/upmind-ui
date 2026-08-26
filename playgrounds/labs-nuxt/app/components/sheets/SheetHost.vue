<template>
  <Sheet
    v-model:open="isOpen"
    :modal="false"
    side="right"
    :close-label="t('action.close')"
    class="flex max-w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
    :ui="{
      header: 'border-surface shrink-0 border-b p-3',
      body: 'flex-1 overflow-y-auto p-4'
    }"
    @interact-outside="(event: Event) => event.preventDefault()"
  >
    <template #title>
      <!-- `data-attrs`, not fallthrough: Tabs spreads its OWN useTestAttrs
           last, so a fallthrough key renders as `tabs` (`CC11`). -->
      <Tabs
        v-model="sheet"
        :tabs="sheetTabs"
        variant="segmented"
        align="between"
        class="w-full"
        :ui="{ content: 'hidden' }"
        :data-attrs="{ 'data-test-key': 'sheet-switcher' }"
      />
    </template>

    <div data-test-key="sheet-host" :data-test-value="sheet">
      <template v-if="sheet === PlaygroundSheetTypes.DEBUG">
        <Tabs v-if="tabs.length > 0" v-model="tab" :tabs="tabs">
          <template
            v-for="section in sections"
            :key="section.name"
            #[`content.${section.name}`]
          >
            <DebugPane :section="section" />
          </template>
        </Tabs>
        <p v-else class="text-muted text-xs" data-test-key="sheet-empty">
          {{ t("labs.sheet_empty") }}
        </p>
      </template>

      <template v-else-if="sheet === PlaygroundSheetTypes.CODE">
        <CodePane v-if="code" v-bind="code" />
        <p v-else class="text-muted text-xs" data-test-key="sheet-empty">
          {{ t("labs.sheet_empty") }}
        </p>
      </template>

      <template v-else-if="sheet === PlaygroundSheetTypes.SCENARIO">
        <ScenarioPane v-if="scenario" v-bind="scenario" />
        <p v-else class="text-muted text-xs" data-test-key="sheet-empty">
          {{ t("labs.sheet_empty") }}
        </p>
      </template>
    </div>
  </Sheet>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module sheets/SheetHost
 * @description THE sheet over the page — one `Sheet.ce.vue` mounted once in the
 * layout, holding whichever view the toggle has open: Debug, Code or Scenario
 * (`AC3.1`, `G14 refined`, `P1-R14`).
 *
 * It is `:modal="false"` and it OVERLAYS: the page keeps its full width with an
 * open sheet, and neither this component nor anything above it compensates with
 * padding (`P1-R5`). An outside click is refused rather than closing it, because
 * the surface a developer is inspecting is the surface they are also clicking.
 *
 * Which is exactly why the panel carries the SWITCHER itself: overlaying means
 * the panel sits over the right of the page, the scenario bar's own toggle
 * among it, so a panel that could only be switched from a control it covers
 * would have to be closed and reopened to change pane. Same three sheets, same
 * catalogue (`SHEET_LABELS`), same `toggle` — one more way in, never a second
 * source of what the sheets are called.
 *
 * It renders what pages registered and imports no page: Debug is the section
 * registry as tabs — which is what makes it page-scoped (`AC3.2`) — while Code
 * and Scenario are the panes the page on screen offered. A sheet the page offers
 * nothing for says so rather than opening blank.
 *
 * Which sheet is open, and which section inside it, are both url state read
 * through `usePlaygroundSheet` (`S11`, `AC9.1`), so the host holds no open state
 * of its own and either way in — the bar's toggle or the panel's own switcher —
 * drives the same composable.
 */

import { Sheet, Tabs } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import CodePane from "./CodePane.vue";
import DebugPane from "./DebugPane.vue";
import ScenarioPane from "./ScenarioPane.vue";
import { usePlaygroundSheet } from "./usePlaygroundSheet";
import { PlaygroundSheetTypes, SHEET_LABELS } from "./usePlaygroundSheet.types";
import { map, values } from "lodash-es";
import type { TabItem } from "@upmind/ui";
// -----------------------------------------------------------------------------

const { isOpen, panes, sections, sheet, tab } = usePlaygroundSheet();

const { t } = useI18n();

const code = computed(() => panes.value[PlaygroundSheetTypes.CODE]);

const scenario = computed(() => panes.value[PlaygroundSheetTypes.SCENARIO]);

// A locator for one pane's tab needs that tab, not the rail's own key.
const sheetTabs = computed<TabItem[]>(() =>
  map(values(PlaygroundSheetTypes), value => ({
    value,
    label: t(SHEET_LABELS[value]),
    dataAttrs: { "data-test-key": "sheet-tab", "data-test-value": value }
  }))
);

const tabs = computed<TabItem[]>(() =>
  map(sections.value, section => ({
    value: section.name,
    label: section.name,
    dataAttrs: {
      "data-test-key": "debug-tab",
      "data-test-value": section.name
    }
  }))
);
</script>
