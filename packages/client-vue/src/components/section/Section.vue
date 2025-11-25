<template>
  <Sections v-bind="forwarded" :sections="sections">
    <template #default>
      <slot />
    </template>

    <template #actions>
      <slot name="actions" />
    </template>
  </Sections>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import { useForwardPropsEmits } from "@upmind-automation/upmind-ui";
import Sections from "./Sections.vue";

// --- types
import type { SectionItem } from "./types";

// -----------------------------------------------------------------------------
const props = defineProps<Omit<SectionItem, "active" | "value">>();

const emits = defineEmits<{
  reject: [Event];
  resolve: [Event];
  click: [Event];
  action: [{ name: string; event: Event }];
}>();

const sections = computed<SectionItem[]>(() => [
  {
    label: props.label,
    value: "section",
    icon: props.icon,
    actions: props?.actions
  }
]);

const forwarded = useForwardPropsEmits({ active: true }, emits);
</script>
