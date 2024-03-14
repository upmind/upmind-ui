<template>
  <component :is="tag" v-html="sanitizedMarkdown" />
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";

const props = withDefaults(defineProps<{ tag?: string; text?: string }>(), {
  tag: "span",
  text: "",
});

const $slots = useSlots();

const sanitizedMarkdown = computed(() => {
  let text = $slots.default && $slots.default()[0].children;
  if (typeof text !== "string") text = props.text || "";
  return DOMPurify.sanitize(marked(text));
});
</script>
