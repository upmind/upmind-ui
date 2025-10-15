<template>
  <Icon
    :icon="icon"
    size="2xs"
    :class="variant === 'flat' ? '' : '[&>svg]:p-1'"
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
