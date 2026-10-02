<template>{{ isAbsent ? "" : text }}</template>

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
const text = computed(() =>
  toString(
    get(isString(value.value) ? useDate(value.value) : value.value, "relative")
  )
);
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellDate") };
</script>
