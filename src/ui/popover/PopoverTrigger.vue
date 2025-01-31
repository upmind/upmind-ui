<script lang="ts" setup>
import { PopoverTrigger, type PopoverTriggerProps } from "radix-vue";

// TODO: Refactor into CE and CVA
import { ringClasses } from "../../assets/styles";
const props = defineProps<PopoverTriggerProps>();
</script>

<template>
  <PopoverTrigger v-bind="props" :class="ringClasses">
    <slot />
  </PopoverTrigger>
</template>
