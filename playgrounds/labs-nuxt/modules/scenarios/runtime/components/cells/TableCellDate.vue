<template>{{ text }}</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/TableCellDate
 * @description A `useDate` descriptor, drawn as its RELATIVE form — the sentence
 * a human reads at a glance rather than the timestamp behind it. The descriptor
 * is the mapper's own (`{ date, relative }`), so nothing here formats a date.
 */

import { uiTypeIs } from "@jsonforms/core";
import { computed } from "vue";
import { resolveScope } from "../../scenario.utils";
import { get, isNil, toString } from "lodash-es";
import type { TableCellProps } from "./cells.types";
import type { TableCellDate } from "../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<TableCellProps<TableCellDate>>();

const text = computed(() => {
  const value = resolveScope(props.row, props.element.scope);
  return isNil(value) ? "" : toString(get(value, "relative"));
});
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellDate") };
</script>
