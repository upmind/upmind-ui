<template>
  <Sanitized
    :tag="tag"
    :modelValue="compiledMarkdown"
    :class="cn('prose prose-p:text-inherit prose-li:text-inherit prose-headings:text-inherit prose-strong:font-[inherit] prose-a:text-inherit font-[inherit] text-[length:inherit] leading-[inherit] text-inherit', props.class)"
    data-testid="markdown"
  />
</template>

<script lang="ts" setup>
// --- external
import { onMounted, computed, useSlots, shallowRef } from "vue";

// --- components
import Sanitized from "../sanitized/Sanitized.vue";

// --- utils
import { first, lowerCase } from "lodash-es";
import { cn } from "../../utils";
// --- types
import type { MarkdownProps } from "./types";
import type { Marked } from "marked";
import type { VNode } from "vue";
// -----------------------------------------------------------------------------

const emits = defineEmits(["mounted"]);

const props = defineProps<MarkdownProps>();

const slots = useSlots() as { default?: () => VNode[] };

// Lazy-load marked module
const markedInstance = shallowRef<Marked | null>(null);

onMounted(async () => {
  const { Marked } = await import("marked");
  markedInstance.value = new Marked({ async: false, breaks: true });
  emits("mounted");
});

const compiledMarkdown = computed((): string => {
  if (!markedInstance.value) return ""; // Loading state

  const slotContent = slots?.default ? slots.default() : [];
  let modelValue =
    first(slotContent)?.children?.toString() || props.modelValue || "";

  if (props.keys) {
    modelValue = modelValue.replace(/({{\s?\w+\s?}})/gi, (match, key) => {
      return props.keys?.[lowerCase(key)] || match;
    });
  }

  return markedInstance.value.parse(modelValue) as string;
});
</script>
