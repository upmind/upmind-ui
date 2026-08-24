<template>
  <component :is="props.as" ref="content" :class="contentClass">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { useElementSize, useWindowSize } from "@vueuse/core";
import { computed, useTemplateRef } from "vue";
import { cn } from "@upmind/ui";
import { contentVariants } from "./variants";
import type { ContentProps } from "./types";

const props = withDefaults(defineProps<ContentProps>(), {
  as: "div",
  gap: "md",
  flow: "vertical",
  width: "auto",
  sticky: "none",
  height: "auto",
  padding: true
});

// Sticky positioning is dropped once the content is taller than the viewport,
// otherwise the pane pins and its overflow becomes unreachable.
const content = useTemplateRef<HTMLElement>("content");
const { height: contentHeight } = useElementSize(content);
const { height: viewportHeight } = useWindowSize();

const contentClass = computed(() =>
  cn(
    contentVariants({
      sticky: props.sticky,
      oversized: contentHeight.value > viewportHeight.value,
      gap: props.gap,
      flow: props.flow,
      justify: props.justify,
      items: props.items,
      width: props.width,
      padding: props.padding,
      height: props.height
    }),
    props.class
  )
);
</script>
