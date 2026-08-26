<template>
  <component :is="props.as" :class="columnClass">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { cn } from "@upmind/ui";
import { computed } from "vue";
import { isMobile } from "../../../../composables/isMobile";
import { useSection } from "../../../section/useSection";
import { columnVariants } from "./variants";
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

// gap collapses inside a card on desktop (preserve the old meta rule).
const columnClass = computed(() =>
  cn(
    columnVariants({
      flow: props.flow,
      gap: (isMobile.value || !card.value) && props.gap,
      background: props.background,
      justify: props.justify,
      items: props.items,
      padding: props.padding,
      width: props.width,
      hide: props.hide,
      show: props.show
    }),
    props.class
  )
);
</script>
