<template>
  <Layout :variant="layout">
    <template v-if="$slots.controls" #controls>
      <slot name="controls" />
    </template>

    <template #header>
      <slot name="header" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <slot />
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useBrand } from "@upmind-automation/headless";

// --- components
import { Layout } from "@upmind-automation/upmind-ui";

// --- types
import type { LayoutProps } from "@upmind-automation/upmind-ui";

const { uiCart } = useBrand();

const slots = defineSlots<{
  default: () => any;
  controls?: () => any;
  header?: () => any;
  content?: () => any;
}>();

const layout = computed((): LayoutProps["variant"] => {
  return (
    hasSlots.value ? uiCart.value?.layout : "default"
  ) as LayoutProps["variant"];
});

const hasSlots = computed(() => {
  return !!(slots.controls || slots.header || slots.content);
});
</script>
