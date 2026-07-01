<template>
  <component :is="props.as" :class="cn(styles.column, props.class)">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { cn, useStyles, isMobile } from "@upmind-automation/upmind-ui";
import { useSection } from "../../../section/useSection";
import config from "./column.config";
import type { ColumnProps } from "./types";

const props = withDefaults(defineProps<ColumnProps>(), {
  as: "div",
  width: "auto",
  padding: "md",
  background: "none",
  flow: "vertical",
  justify: "none",
  items: "none",
  gap: true,
  hide: "never",
  show: "always"
});

const { card } = useSection();

const meta = computed(() => ({
  flow: props.flow,
  gap: (isMobile.value || !card.value) && props.gap,
  background: props.background,
  justify: props.justify,
  items: props.items,
  padding: props.padding,
  width: props.width,
  hide: props.hide,
  show: props.show
}));

const styles = useStyles(["column"], meta, config);
</script>
