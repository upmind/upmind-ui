<template>
  <NumberField
    v-if="quantifiable"
    :model-value="quantity"
    @update:model-value="doUpdateQuantity"
    :min="effectiveMin"
    :max="max"
    :step="step"
    :disabled="disabled"
    width="sm"
    :single-step="false"
    :decrement-action="decrementAction"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module basket-product/BasketQuantityField
 * @description Basket-specific quantity field that swaps the decrement button
 * for a trash/remove action when the quantity equals the minimum value.
 */

// --- external
import { computed } from "vue";

// --- components
import { NumberField } from "@upmind-automation/upmind-ui";

// --- types
import type { QuantityFieldProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<QuantityFieldProps>();

const emits = defineEmits(["update:quantity", "remove"]);

// --- state

const effectiveMin = computed(() => (props.min === 0 ? 1 : props.min) ?? 1);

const isAtMinimum = computed(() => props.quantity === effectiveMin.value);

const decrementAction = computed(() => {
  if (isAtMinimum.value) {
    return { icon: "trash-02", handler: doRemove };
  }
});

// --- methods

function doUpdateQuantity(value: number | undefined) {
  if (value) {
    emits("update:quantity", value);
  }
}

function doRemove() {
  emits("remove");
}
</script>
