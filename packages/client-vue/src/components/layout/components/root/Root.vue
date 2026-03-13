<template>
  <div :class="cn(styles.root, props.class)">
    <slot />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, type HTMLAttributes } from "vue";

// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./root.config";
import { useLayout } from "../../useLayout";

// --- types

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const { overflow } = useLayout();

const meta = computed(() => ({
  overflow: overflow.value
}));

const styles = useStyles(["root"], meta, config);
</script>
