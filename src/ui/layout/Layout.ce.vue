<template>
  <section>
    <component :is="layoutComponent">
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
    </component>
  </section>
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
    case "enclosed":
      return EnclosedLayout;
    case "full":
      return FullLayout;
    default:
      return DefaultLayout;
  }
});
</script>
