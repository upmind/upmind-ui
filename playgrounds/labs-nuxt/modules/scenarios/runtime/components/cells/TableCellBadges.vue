<template>
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

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/TableCellBadges
 * @description The declared flags a record carries, drawn as badges — one per
 * TRUTHY flag, so the cell says what is true of this record and stays silent
 * about the rest.
 */

import { uiTypeIs } from "@jsonforms/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind-automation/upmind-ui";
import { resolveScope } from "../../scenario.utils";
import { filter, get } from "lodash-es";
import type { TableCellProps } from "./cells.types";
import type { TableBadge, TableCellBadges } from "../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<TableCellProps<TableCellBadges>>();

const { t } = useI18n();

const badges = computed<TableBadge[]>(() => {
  const value = resolveScope(props.row, props.element.scope);
  return filter(
    props.element.options.badges,
    badge => !!get(value, badge.flag)
  );
});
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellBadges") };
</script>
