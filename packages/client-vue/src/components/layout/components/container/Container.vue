<template>
  <div :class="cn(styles.container, props.class)">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./container.config";
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

const styles = useStyles(["container"], meta, config);
</script>
