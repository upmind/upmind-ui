<template>
  <button
    v-if="props.action"
    @click="props.action.handler"
    :class="props.class"
  >
    <slot />
  </button>
  <component
    v-else
    :is="props.is"
    :size="props.size"
    :class="props.class"
  >
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

// --- external
import type { Component, HTMLAttributes } from "vue";

// --- types
import type { NumberFieldAction } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<{
  /** The underlying component to render when no override is provided. */
  is: Component;
  /** Custom action — renders a plain button with the action handler. */
  action?: NumberFieldAction;
  /** Size variant passed to the underlying component. */
  size?: string;
  class?: HTMLAttributes["class"];
}>();
</script>
