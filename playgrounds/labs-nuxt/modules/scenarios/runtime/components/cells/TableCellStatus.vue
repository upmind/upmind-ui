<template>
  <StatusBadge v-if="label" size="sm" tone="neutral">{{ label }}</StatusBadge>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/TableCellStatus
 * @description A record's ONE status, drawn as the status badge the record
 * header draws — the scoped value's `name` (a mapped `{ code, name }` status),
 * or the value itself when it is already the label.
 */

import { uiTypeIs } from "@jsonforms/core";
import { StatusBadge } from "@upmind/ui";
import { computed, unref } from "vue";
import { resolveScope } from "../../scenario.utils";
import { get, isNil, isPlainObject, toString } from "lodash-es";
import type { TableCellProps } from "./cells.types";
import type { TableCellStatus } from "../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<TableCellProps<TableCellStatus>>();

const label = computed(() => {
  const value = resolveScope(props.row, props.element.scope);
  const name = unref(isPlainObject(value) ? get(value, "name") : value);
  return isNil(name) ? "" : toString(name);
});
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellStatus") };
</script>
