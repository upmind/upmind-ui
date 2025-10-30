<template>
  <Sections :active="active" :sections="sections">
    <template #default>
      <slot />
    </template>
  </Sections>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

import Sections from "./Sections.vue";

// --- types
import type { SectionProps, SectionItem } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SectionProps>(), {
  active: true
});

const sections = computed<SectionItem[]>(() => [
  {
    label: props.label,
    value: "section",
    icon: props.icon
  }
]);
</script>
