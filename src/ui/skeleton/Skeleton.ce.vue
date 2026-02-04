<template>
  <div :class="cn(styles.skeleton.root, props.class)">
    <div :class="styles.skeleton.content"><slot>Skeleton</slot></div>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
// --- internal
import config from "./skeleton.config";
// --- utils
import { cn, useStyles } from "../../utils";
// --- types
import type { SkeletonProps } from "./types";
const props = withDefaults(defineProps<SkeletonProps>(), {
  active: true
});

const meta = computed(() => ({
  isActive: props.active
}));

const styles = useStyles("skeleton", meta, config, props.uiConfig ?? {});
</script>
