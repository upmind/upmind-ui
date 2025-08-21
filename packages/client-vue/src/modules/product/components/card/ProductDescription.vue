<template>
  <component :is="component">
    {{ description }}
  </component>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";

// internal
import config from "./product.config";

// --- components
import { Lineclamp } from "@upmind-automation/upmind-ui";

// --- types
import type { Product } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

const props = defineProps<{
  description: Product["productDetails"]["description"];
  lineclamp?: boolean;
}>();

const component = computed(() => {
  if (props.lineclamp) {
    return Lineclamp;
  }
  return "p";
});

const styles = useStyles(
  ["product.header", "product.header.info"],
  {},
  config
) as ComputedRef<{
  product: {
    header: {
      info: {
        description: string;
      };
    };
  };
}>;
</script>
