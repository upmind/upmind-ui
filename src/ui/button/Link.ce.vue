<script lang="ts" setup>
import type { ButtonProps } from "./types";
import Button from "./Button.ce.vue";
import { useForwardPropsEmits } from "radix-vue";

const props = defineProps<ButtonProps>();
const emits = defineEmits<{ click: [event: Event] }>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <Button v-bind="forwarded" variant="link">
    <template #prepend>
      <slot name="prepend"></slot>
    </template>

    <slot></slot>

    <template #append>
      <slot name="append"></slot>
    </template>
  </Button>
</template>
