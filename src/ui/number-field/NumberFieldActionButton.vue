<template>
  <button
    v-if="props.action"
    @click="props.action.handler"
    :class="props.class"
  >
    <slot />
  </button>
  <component v-else :is="props.is" :size="props.size" :class="props.class">
    <slot />
  </component>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module number-field/NumberFieldActionButton
 * @description Wrapper component for NumberField action buttons (decrement/increment).
 * When `action` is provided, renders a plain button with the custom handler.
 * Otherwise, delegates to the underlying Radix component.
 */

// --- types
import type { NumberFieldActionButtonProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<NumberFieldActionButtonProps>();
</script>
