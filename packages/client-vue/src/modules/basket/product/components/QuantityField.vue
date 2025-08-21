<template>
  <NumberField
    v-if="quantifiable"
    :model-value="quantity"
    @update:model-value="doUpdateQuantity"
    :min="min === 0 ? 1 : min"
    :max="max"
    :step="step"
    variant="minimal"
    width="md"
  />
</template>

<script lang="ts" setup>
import { NumberField } from "@upmind-automation/upmind-ui";

defineProps<{
  id: string;
  quantifiable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  quantity?: number;
}>();

const emits = defineEmits(["update:quantity"]);

function doUpdateQuantity(value: number) {
  emits("update:quantity", value);
}
</script>
