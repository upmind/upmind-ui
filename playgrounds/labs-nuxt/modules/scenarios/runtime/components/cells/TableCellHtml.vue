<template>
  <Sanitized as="div" :html="html" :class="cellHtml()" />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/TableCellHtml
 * @description The declared field as SANITIZED HTML — an email body, a note,
 * any value the API returns as markup. It draws through the ui `Sanitized`
 * component (dompurify), so the markup renders as markup and never as escaped
 * text, and the treatment is the ONE sanitizer the product already ships rather
 * than a second one bolted on here.
 */

import { uiTypeIs } from "@jsonforms/core";
import { Sanitized } from "@upmind/ui";
import { computed } from "vue";
import { resolveScope } from "../../scenario.utils";
import { cellHtml } from "./cells.styles";
import { isNil, toString } from "lodash-es";
import type { TableCellProps } from "./cells.types";
import type { TableCellHtml } from "../../scenario.types";
// -----------------------------------------------------------------------------

const props = defineProps<TableCellProps<TableCellHtml>>();

const html = computed(() => {
  const value = resolveScope(props.row, props.element.scope);
  return isNil(value) ? "" : toString(value);
});
</script>

<script lang="ts">
export const tester = { rank: 1, controlType: uiTypeIs("TableCellHtml") };
</script>
