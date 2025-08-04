<template>
  <component :is="layoutComponent" :minimal="minimal">
    <template #controls>
      <slot name="controls" />
    </template>

    <template #navigation>
      <slot name="navigation" />
    </template>

    <template #actions>
      <slot name="actions" />
    </template>

    <template #header>
      <slot name="header" />
    </template>

    <template #default>
      <slot name="default" />
    </template>

    <template #aside>
      <slot name="aside" />
    </template>

    <template #aside-footer>
      <slot name="aside-footer" />
    </template>

    <template #footer>
      <slot name="footer" />
    </template>
  </component>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import DefaultLayout from "./DefaultLayout.vue";
import EnclosedLayout from "./EnclosedLayout.vue";
import FullLayout from "./FullLayout.vue";

// --- types
import type { LayoutProps } from "./types";

const props = defineProps<LayoutProps>();

const layoutComponent = computed(() => {
  switch (props.variant) {
    case "default":
      return DefaultLayout;

    case "enclosed":
      return EnclosedLayout;

    case "full":
    default:
      return FullLayout;
  }
});
</script>
