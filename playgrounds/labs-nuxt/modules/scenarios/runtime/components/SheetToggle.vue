<template>
  <ButtonGroup
    v-if="hasSections"
    :items="entries"
    size="sm"
    data-test-key="sheet-toggle"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/SheetToggle
 * @description The page's one way into its own internals: Debug │ Code │
 * Scenario, three entries of a SINGLE `ButtonGroup`. Preview is dropped — the
 * page IS the preview — and Code is a page feature, not a tab of Debug
 * (`G14 refined`, `AC3.1`). It lives inside the scenario bar, in the space the
 * killed track chips freed (`R7-10`) — and nothing else joins it there: a forced
 * state has nothing to do with the sheets, so it is chosen in the scenario menu
 * beside Live (`R7-11`).
 *
 * It holds no open state of its own and it decides nothing about opening: the
 * marked entry is the sheet `usePlaygroundSheet` reports open, and a click is
 * that composable's own `toggle` — which writes `sheet=` through
 * `usePlaygroundUrlState`, the playground's one query-string writer (`S11`,
 * `AC9.1`), and records the preference a silent url falls back to (`P1-R4`).
 * Reading the url param here instead would leave the toggle marking nothing
 * while the preference holds a sheet open over the page.
 *
 * A page that registers no sections has nothing to show, so it offers no
 * toggle at all (design §3.6, `P1-R4`).
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ButtonGroup, ButtonGroupTypes } from "@upmind-automation/upmind-ui";
import { usePlaygroundSheet } from "../../../../app/components/sheets/usePlaygroundSheet";
import { SHEET_LABELS } from "../../../../app/components/sheets/usePlaygroundSheet.types";
import { map } from "lodash-es";
import type { ButtonGroupItem } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const { sheet, hasSections, toggle } = usePlaygroundSheet();

const { t } = useI18n();

const entries = computed<ButtonGroupItem[]>(() =>
  map(SHEET_LABELS, (label, value) => ({
    type: ButtonGroupTypes.Button,
    active: sheet.value === value,
    props: {
      label: t(label),
      // The value is stated, not inherited: `Button`'s own fallback derives
      // `data-test-value` from the rendered label, which is translated — a
      // locale change would silently rename every entry's handle.
      dataAttrs: { "data-test-key": "sheet", "data-test-value": value }
    },
    handler: () => toggle(value)
  }))
);
</script>
