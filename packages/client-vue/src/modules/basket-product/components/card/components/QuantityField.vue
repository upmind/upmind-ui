<template>
  <NumberField
    v-if="quantifiable"
    :model-value="quantity"
    @update:model-value="doUpdateQuantity"
    :min="min === 0 ? 1 : min"
    :max="max"
    :step="step"
    :disabled="disabled"
    variant="minimal"
    width="md"
  />
</template>

<script lang="ts" setup>
import { NumberField } from "@upmind/ui";
import type { QuantityFieldProps } from "./types";

defineProps<QuantityFieldProps>();

const emits = defineEmits(["update:quantity"]);

function doUpdateQuantity(value: number | undefined) {
  if (value) {
    emits("update:quantity", value);
  }
}
</script>
