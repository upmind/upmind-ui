<template>
  <DescriptionListRoot
    orientation="stacked"
    size="sm"
    gap="sm"
    :class="recordSection.grid()"
  >
    <DescriptionItem
      v-for="element in cells"
      :key="element.scope"
      :term="i18n.translate(element.i18n, element.i18n)"
      :class="[recordSection.field(), fieldWidth(element)]"
      :data-test-key="`record-field-${kebabCase(element.i18n)}`"
    >
      <CellDispatcher :element="element" :row="model" />
    </DescriptionItem>
  </DescriptionListRoot>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/record/RecordFieldGrid
 * @description A record's declared cells as one description grid, each field
 * taking the share of the row its `options.width` declares (the table's own
 * width map) and drawn through the table's `CellDispatcher`. A field its rule
 * hides or the record carries no value for is not drawn.
 */

import { DescriptionItem, DescriptionListRoot } from "@upmind/ui";
import { computed } from "vue";
import { useFormI18n } from "@upmind-automation/foundation";
import { CellDispatcher } from "../../cells";
import { recordSection } from "./record.styles";
import { drawableCells, fieldWidth } from "./record.utils";
import { kebabCase } from "lodash-es";
import type { RecordFieldGridProps } from "./record.types";
// -----------------------------------------------------------------------------

const props = defineProps<RecordFieldGridProps>();

const i18n = useFormI18n();

const cells = computed(() => drawableCells(props.elements, props.model));
</script>
