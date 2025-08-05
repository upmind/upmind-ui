<template>
  <div :class="styles.section.root">
    <h4 v-if="title" :class="styles.section.title">{{ title }}</h4>
    <component :is="component" :class="cn(styles.section.content, props.class)">
      <slot name="default" />
    </component>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- components
import Card from "../card/Card.ce.vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./layout.config";

// --- types
import { type ComputedRef } from "vue";
import { type SectionProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SectionProps>(), {
  as: "section"
});

const meta = computed(() => {
  return {
    variant: props.variant
  };
});

const component = computed(() => {
  if (props.variant === "enclosed" && props.as === "section") {
    return Card;
  }

  return props.as;
});

const styles = useStyles("section", meta, config) as ComputedRef<{
  section: {
    root: string;
    title: string;
    content: string;
  };
}>;
</script>
