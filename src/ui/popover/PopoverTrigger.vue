<template>
  <PopoverTrigger v-bind="props" :class="ring ? ringClasses : ''" as-child>
    <slot />
  </PopoverTrigger>
</template>

<script lang="ts" setup>
import { PopoverTrigger, type PopoverTriggerProps } from "radix-vue";
// TODO: Refactor into CE and CVA
import { ringClasses } from "../../assets/styles";

const props = withDefaults(
  defineProps<PopoverTriggerProps & { ring?: boolean }>(),
  {
    ring: true
  }
);
</script>
