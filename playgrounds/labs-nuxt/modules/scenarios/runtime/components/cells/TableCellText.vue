<template>{{ text }}</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/TableCellText
 * @description The declared field as TEXT — the treatment a value takes when it
 * is not a date, a flag or a set of badges.
 */

import { uiTypeIs } from "@jsonforms/core";
import { computed } from "vue";
import { resolveScope } from "../../scenario.utils";
import { isNil, toString } from "lodash-es";
import type { TableCellProps } from "./cells.types";
import type { TableCellText } from "../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<TableCellProps<TableCellText>>();

const text = computed(() => {
  const value = resolveScope(props.row, props.element.scope);
  return isNil(value) ? "" : toString(value);
});
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellText") };
</script>
