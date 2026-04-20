<template>
  <Icon :icon="icon" :size="variant === 'flat' ? 'md' : 'md'" />
</template>

<script setup lang="ts">
import { Icon } from "../icon";
import type { NumberFieldProps } from "./types";

defineProps<{
  icon: string;
  variant?: NumberFieldProps["variant"];
}>();
</script>
