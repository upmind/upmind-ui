<template>
  <component :is="component">
    {{ description }}
  </component>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- components
import { Lineclamp } from "@upmind-automation/upmind-ui";

// --- types
import type { Product } from "@upmind-automation/headless";

const props = defineProps<{
  description?: Product["productDetails"]["description"];
  lineclamp?: boolean;
}>();

const component = computed(() => {
  if (props.lineclamp) {
    return Lineclamp;
  }
  return "p";
});
</script>
