<template>
  <RecordFieldGrid :elements="section.elements" :model="model" />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/record/RecordFieldsSection
 * @description The `fields` section kind — the record's declared cells as the
 * record's description grid.
 */

import RecordFieldGrid from "./RecordFieldGrid.vue";
import type { RecordSectionProps } from "./record.types";
import type { RecordFieldsSection } from "../../../scenario.types";
// -----------------------------------------------------------------------------

defineProps<RecordSectionProps<RecordFieldsSection>>();
</script>
