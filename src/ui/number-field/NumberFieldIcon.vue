<template>
  <Icon
    :icon="icon"
    :size="variant === 'flat' ? '2xs' : 'xs'"
    :class="variant === 'flat' ? '' : '[&>svg]:p-[1px]'"
  />
</template>

<script setup lang="ts">
import { Icon } from "../icon";
import type { NumberFieldProps } from "./types";

defineProps<{
  icon: string;
  variant?: NumberFieldProps["variant"];
}>();
</script>
