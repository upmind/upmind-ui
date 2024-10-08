<template>
  <Slot
    :id="props.formItemId"
    :aria-describedby="
      !props.error
        ? `${props.formDescriptionId}`
        : `${props.formDescriptionId} ${props.formMessageId}`
    "
    :aria-invalid="!!error"
  >
    <slot />
  </Slot>
</template>

<script lang="ts" setup>
import { Slot } from "radix-vue";

const props = defineProps<{
  error: boolean;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
}>();
</script>
