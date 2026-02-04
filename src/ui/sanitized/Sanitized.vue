<template>
  <component :is="tag" v-html="sanitized" />
</template>

<script lang="ts" setup>
// --- external
import dompurify from "dompurify";
import { computed } from "vue";
// --- types
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    tag?: string;
    modelValue: string;
  }>(),
  {
    tag: "span"
  }
);

const sanitized: ComputedRef<string> = computed(() => {
  // See https://github.com/cure53/DOMPurify for options
  // We add attr 'target' so blank links will work from render templates
  return dompurify.sanitize(props.modelValue, { ADD_ATTR: ["target"] });
});
</script>
