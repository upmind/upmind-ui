<template>
   <Sanitized :key="compiledMarkdown" :modelValue="compiledMarkdown" />
</template>

<script lang="ts" setup>
// --- external
import { onMounted, computed, useSlots } from "vue";
import { marked } from "marked";

// --- components
import Sanitized from "../sanitized/Sanitized.vue";

// --- utils
import { first } from "lodash-es";

// --- types
import type { ComputedRef, VNode } from "vue";

// -----------------------------------------------------------------------------

const emits = defineEmits(["mounted"]);

const props = defineProps<{
  modelValue: string;
}>();

const slots = useSlots() as { default?: () => VNode[] };

marked.setOptions({ breaks: true });

const compiledMarkdown: ComputedRef<string> = computed(() => {
  const slotContent = slots?.default ? slots.default() : [];
  const modelValue =
    first(slotContent)?.children?.toString() || props.modelValue;
  return marked(modelValue);
});

// --- lifecycle
onMounted(() => {
  emits("mounted");
});
</script>

