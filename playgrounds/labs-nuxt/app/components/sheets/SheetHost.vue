<template>
  <Sheet
    v-model:open="isOpen"
    :modal="false"
    side="right"
    :title="t(title)"
    :class="styles.sheetHost.root"
    :class-header="styles.sheetHost.header"
    @interact-outside="event => event.preventDefault()"
  >
    <template #header>
      <ButtonGroup :items="switcher" size="sm" data-test-key="sheet-switcher" />
    </template>

    <div data-test-key="sheet-host" :data-test-value="sheet">
      <Tabs
        v-if="sheet === PlaygroundSheetTypes.DEBUG"
        v-model="tab"
        :tabs="tabs"
        :class="styles.sheetHost.tabs"
      >
        <template
          v-for="section in sections"
          :key="section.name"
          #[`content.${section.name}`]
        >
          <div :class="styles.sheetHost.pane">
            <DebugPane :section="section" />
          </div>
        </template>
      </Tabs>

      <div v-else :class="[styles.sheetHost.pane, styles.sheetHost.body]">
        <CodePane
          v-if="sheet === PlaygroundSheetTypes.CODE && code"
          v-bind="code"
        />
        <ScenarioPane
          v-else-if="sheet === PlaygroundSheetTypes.SCENARIO && scenario"
          v-bind="scenario"
        />
        <p v-else :class="styles.sheetHost.empty" data-test-key="sheet-empty">
          {{ t("labs.sheet_empty") }}
        </p>
      </div>
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

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  ButtonGroup,
  ButtonGroupTypes,
  Sheet,
  Tabs,
  useStyles
} from "@upmind-automation/upmind-ui";
import CodePane from "./CodePane.vue";
import DebugPane from "./DebugPane.vue";
import ScenarioPane from "./ScenarioPane.vue";
import config from "./sheets.styles";
import { usePlaygroundSheet } from "./usePlaygroundSheet";
import { PlaygroundSheetTypes, SHEET_LABELS } from "./usePlaygroundSheet.types";
import { map } from "lodash-es";
import type { ButtonGroupItem, TabItem } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const { isOpen, open, panes, sections, sheet, tab } = usePlaygroundSheet();

const { t } = useI18n();

const title = computed(
  () => SHEET_LABELS[sheet.value ?? PlaygroundSheetTypes.DEBUG]
);

// `open`, never `toggle`: the panel is already open, so the entry that is
// already marked would close the very panel the pointer is inside.
const switcher = computed<ButtonGroupItem[]>(() =>
  map(SHEET_LABELS, (label, value) => ({
    type: ButtonGroupTypes.Button,
    active: sheet.value === value,
    props: {
      label: t(label),
      dataAttrs: {
        "data-test-key": "sheet-pane",
        "data-test-value": value
      }
    },
    handler: () => open(value as PlaygroundSheetTypes)
  }))
);

const code = computed(() => panes.value[PlaygroundSheetTypes.CODE]);

const scenario = computed(() => panes.value[PlaygroundSheetTypes.SCENARIO]);

const tabs = computed<TabItem[]>(() =>
  map(sections.value, section => ({ value: section.name, label: section.name }))
);

const styles = useStyles(["sheetHost"], {}, config);
</script>
