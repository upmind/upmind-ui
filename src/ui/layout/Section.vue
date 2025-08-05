<template>
  <component :is="as" :class="cn(styles.section.root, props.class)">
    <h4 v-if="title" :class="styles.section.title">{{ title }}</h4>

    <Card v-if="meta.hasCard">
      <slot name="default" />
    </Card>

    <slot v-else name="default" />
  </component>
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
    variant: props.variant,
    hasCard: props.variant === "enclosed"
  };
});

const styles = useStyles("section", meta, config) as ComputedRef<{
  section: {
    root: string;
    title: string;
  };
}>;
</script>
