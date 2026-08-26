<template>
  <NumberField
    v-if="quantifiable"
    :model-value="quantity"
    @update:model-value="doUpdateQuantity"
    :min="min || 1"
    :max="max"
    :step="step"
    :disabled="disabled"
    width="sm"
    :single-step="false"
  >
    <!-- At minimum quantity the decrement becomes a remove action. The button
         fills the stepper frame the component provides, so it matches the +.
         NumberField's `disabled` reaches its own primitives, never slot
         content, so this button carries the gate itself. -->
    <template v-if="atMin" #decrement>
      <button
        type="button"
        :disabled="disabled"
        :aria-label="t('action.remove')"
        class="text-muted hover:text-body flex size-full items-center justify-center transition disabled:cursor-not-allowed"
        @click="emits('remove')"
      >
        <Icon icon="trash-02" class="size-4" />
      </button>
    </template>
  </NumberField>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module basket-product/BasketQuantityField
 * @description Basket-specific quantity field that swaps the decrement button
 * for a trash/remove action when the quantity equals the minimum value.
 */

import { NumberField } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "../../../../../components/icon";
import { isNil } from "lodash-es";
import type { QuantityFieldProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<QuantityFieldProps>();

const emits = defineEmits(["update:quantity", "remove"]);

const { t } = useI18n();

// --- state

const atMin = computed(() => props.quantity === (props.min || 1));

// --- methods

function doUpdateQuantity(value: number | undefined) {
  if (!isNil(value)) {
    emits("update:quantity", value);
  }
}
</script>
