<template>
  <component :is="layoutComponent">
    <template v-if="$slots.controls" #controls>
      <slot name="controls" />
    </template>

    <template #header>
      <slot name="header" />
    </template>

    <template #default>
      <slot name="default" />
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
