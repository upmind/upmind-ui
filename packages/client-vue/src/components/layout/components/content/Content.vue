<template>
  <component :is="props.as" :class="cn(styles.content, props.class)">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
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

const meta = computed(() => ({
  sticky: props.sticky,
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
