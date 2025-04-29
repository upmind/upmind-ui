<template>
  <Sanitized :modelValue="compiledMarkdown" data-testid="markdown" />
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
import type { VNode } from "vue";

// -----------------------------------------------------------------------------

const emits = defineEmits(["mounted"]);

const props = defineProps<{
  modelValue?: string;
}>();

const slots = useSlots() as { default?: () => VNode[] };

marked.use({ async: false, breaks: true });

const compiledMarkdown = computed((): string => {
  const slotContent = slots?.default ? slots.default() : [];
  const modelValue =
    first(slotContent)?.children?.toString() || props.modelValue || "";
  return marked.parse(modelValue) as string;
});

// --- lifecycle
onMounted(() => {
  emits("mounted");
});
</script>
