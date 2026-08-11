<template>
  <template v-if="element.options.cell === RowCellTypes.BADGES">
    <Badge
      v-for="badge in badges"
      :key="badge.flag"
      size="sm"
      variant="muted"
      :color="badge.color"
      :icon="badge.icon"
      :label="t(badge.i18n)"
    />
  </template>
  <template v-else>{{ text }}</template>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/RowCell
 * @description ONE declared field of one row, drawn the way its declaration
 * says. The same cell serves the table, the card and the read-only row list, so
 * a scenario's `cell` treatment cannot mean one thing in a column and another in
 * a card.
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind-automation/upmind-ui";
import { RowCellTypes } from "../../scenario.types";
import { resolveScope } from "../../scenario.utils";
import { filter, get, isNil, toString } from "lodash-es";
import type { RowCellProps } from "./ListSurface.types";
import type { RowBadge } from "../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<RowCellProps>();

const { t } = useI18n();

const value = computed(() => resolveScope(props.row, props.element.scope));

/** The badges this cell shows — truthy flags only. */
const badges = computed<RowBadge[]>(() =>
  filter(
    props.element.options.badges ?? [],
    badge => !!get(value.value, badge.flag)
  )
);

/** What a non-badge cell reads. A `useDate` descriptor speaks its relative form. */
const text = computed(() => {
  if (isNil(value.value)) return "";

  return props.element.options.cell === RowCellTypes.DATE
    ? toString(get(value.value, "relative"))
    : toString(value.value);
});
</script>
