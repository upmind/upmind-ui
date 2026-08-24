<template>
  <Sections v-bind="forwarded" :sections="sections" :dataAttrs="dataAttrs">
    <template #default>
      <slot />
    </template>

    <template v-if="!!slots.actions" #actions>
      <slot name="actions" />
    </template>
  </Sections>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
import { useForwardPropsEmits } from "@upmind/ui";
import Sections from "./Sections.vue";
import type { SectionItem } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<Omit<SectionItem, "value"> & { value?: string }>(),
  {
    value: "section"
  }
);

const emits = defineEmits<{
  reject: [Event];
  resolve: [Event];
  click: [Event];
  action: [{ name: string; event: Event }];
}>();

const sections = computed<SectionItem[]>(() => [
  {
    label: props.label,
    value: props.value,
    icon: props.icon,
    actions: props?.actions,
    dataAttrs: props.dataAttrs
  }
]);

const forwarded = useForwardPropsEmits({ active: true }, emits);
const slots = useSlots();
</script>
