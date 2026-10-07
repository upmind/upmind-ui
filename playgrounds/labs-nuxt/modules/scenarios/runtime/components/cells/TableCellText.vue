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
import { useI18n } from "vue-i18n";
import { resolveScope } from "../../scenario.utils";
import { isNil, toString } from "lodash-es";
import type { TableCellProps } from "./cells.types";
import type { TableCellText } from "../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<TableCellProps<TableCellText>>();

const { t } = useI18n();

const text = computed(() => {
  const value = resolveScope(props.row, props.element.scope);
  if (isNil(value)) return "";
  const prefix = props.element.options?.i18nValue;
  if (!prefix) return toString(value);
  // `t` hands an unknown key back, so a code with no label draws as itself.
  const key = `${prefix}.${toString(value)}`;
  const label = t(key);
  return label === key ? toString(value) : label;
});
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellText") };
</script>
