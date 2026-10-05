<template>
  <template v-if="!isAbsent">
    <span v-if="align === 'right'" class="block w-full text-right">
      <Tooltip v-if="tooltip && fullDate" :label="fullDate">{{ text }}</Tooltip>
      <template v-else>{{ text }}</template>
    </span>
    <Tooltip v-else-if="tooltip && fullDate" :label="fullDate">{{
      text
    }}</Tooltip>
    <template v-else>{{ text }}</template>
  </template>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/TableCellDate
 * @description A `useDate` descriptor, drawn as its RELATIVE form — the sentence
 * a human reads at a glance rather than the timestamp behind it. The descriptor
 * is the mapper's own (`{ date, relative }`), so nothing here formats a date.
 * A raw wire date string is described through the same `useDate`. A value
 * carrying no real date — absent, or the API's zero sentinel — draws nothing,
 * so a card slot collapses and a record surface leaves the field out.
 */

import { uiTypeIs } from "@jsonforms/core";
import { Tooltip } from "@upmind/ui";
import { computed } from "vue";
import { useDate } from "@upmind-automation/headless";
import { isAbsentDate, resolveScope } from "../../scenario.utils";
import { get, isString, toString } from "lodash-es";
import type { TableCellProps } from "./cells.types";
import type { TableCellDate } from "../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<TableCellProps<TableCellDate>>();

const value = computed(() => resolveScope(props.row, props.element.scope));

const isAbsent = computed(() => isAbsentDate(value.value));

// A raw wire date (a `raw` record's own `next_due_date`) is described here
// through the same `useDate` the mappers use.
const descriptor = computed(() =>
  isString(value.value) ? useDate(value.value) : value.value
);

const text = computed(() => toString(get(descriptor.value, "relative")));

const fullDate = computed(() => toString(get(descriptor.value, "date")));

const tooltip = computed(() => !!props.element.options?.tooltip);

const align = computed(() => props.element.options?.align);
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellDate") };
</script>
