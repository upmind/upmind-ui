<template>
  <Sanitized :tag="tag" :modelValue="compiledMarkdown" data-testid="markdown" />
</template>

<script lang="ts" setup>
// --- external
import { onMounted, computed, useSlots } from "vue";
import { marked } from "marked";

// --- components
import Sanitized from "../sanitized/Sanitized.vue";

// --- utils
import { first, lowerCase } from "lodash-es";

// --- types
import type { VNode } from "vue";
import type { MarkdownProps } from "./types";

// -----------------------------------------------------------------------------

const emits = defineEmits(["mounted"]);

const props = defineProps<MarkdownProps>();

const slots = useSlots() as { default?: () => VNode[] };

marked.use({ async: false, breaks: true });

const compiledMarkdown = computed((): string => {
  const slotContent = slots?.default ? slots.default() : [];
  let modelValue =
    first(slotContent)?.children?.toString() || props.modelValue || "";

  if (props.keys) {
    modelValue = modelValue.replace(/({{\s?\w+\s?}})/gi, (match, key) => {
      return props.keys?.[lowerCase(key)] || match;
    });
  }

  return marked.parse(modelValue) as string;
});

// --- lifecycle
onMounted(() => {
  emits("mounted");
});
</script>
