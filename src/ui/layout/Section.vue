<template>
  <component :is="as" :class="cn(styles.section.root, props.class)">
    <h4 v-if="title" :class="styles.section.title">{{ title }}</h4>

    <slot name="default" />
  </component>
</template>

<script setup lang="ts">
// --- internal
import { cn, useStyles } from "../../utils";
import config from "./layout.config";

// --- types
import { type ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    title?: string;
    as?: string;
    class?: string;
  }>(),
  {
    as: "section"
  }
);

const styles = useStyles("section", {}, config) as ComputedRef<{
  section: {
    root: string;
    title: string;
  };
}>;
</script>
