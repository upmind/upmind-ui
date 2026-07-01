<template>
  <div :class="cn(styles.root, props.class)">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed, type HTMLAttributes } from "vue";
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import { useLayout } from "../../useLayout";
import config from "./root.config";

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
