<template>
  <div :class="cn(styles.container, props.class)">
    <slot />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./container.config";

// --- types
import type { ComputedRef } from "vue";
import type { ContainerProps } from "./types";

const props = withDefaults(defineProps<ContainerProps>(), {
  flow: "none",
  items: "none",
  justify: "none",
  reverse: false
});

const meta = computed(() => ({
  flow: props.flow,
  items: props.items,
  justify: props.justify,
  reverse: props.reverse
}));

const styles = useStyles(["container"], meta, config) as ComputedRef<{
  container: string;
}>;
</script>
