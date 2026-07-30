<template>
  <component
    :is="props.as"
    ref="content"
    :class="cn(styles.content, props.class)"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { useElementSize, useWindowSize } from "@vueuse/core";
import { computed, useTemplateRef } from "vue";
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./content.config";
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

const content = useTemplateRef<HTMLElement>("content");
const { height: contentHeight } = useElementSize(content);
const { height: viewportHeight } = useWindowSize();

const meta = computed(() => ({
  sticky: props.sticky,
  oversized: contentHeight.value > viewportHeight.value,
  gap: props.gap,
  flow: props.flow,
  justify: props.justify,
  items: props.items,
  width: props.width,
  padding: props.padding,
  height: props.height
}));

const styles = useStyles(["content"], meta, config);
</script>
