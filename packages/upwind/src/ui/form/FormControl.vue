<template>
  <Slot
    :id="props.formItemId"
    :aria-describedby="
      !props.invalid
        ? `${props.formDescriptionId}`
        : `${props.formDescriptionId} ${props.formMessageId}`
    "
    :aria-invalid="!!props.invalid"
    :autofocus="undefined"
    class="w-full"
  >
    <slot />
  </Slot>
</template>

<script lang="ts" setup>
// NB its important to NOT set autofocus as we are controlling it via the intersection observer
// and we DONT want the normal browser behaviour of scrolling to the element

import { Slot } from "radix-vue";
// import { isFunction } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps<{
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  invalid?: boolean;
  autoFocus?: boolean;
}>();

// --- state

// --- computed

// --- lifecycle

// --- side effects
</script>
