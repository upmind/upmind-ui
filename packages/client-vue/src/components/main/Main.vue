<template>
  <main :class="cn(styles.main, props.class)">
    <slot />
  </main>
</template>

<script lang="ts" setup>
import { computed } from "vue";

// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./main.config";
import { useLayout } from "../layout/useLayout";

// --- types
import type { HTMLAttributes, ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const { mode } = useLayout();

const meta = computed(() => ({
  mode: mode.value
}));

const styles = useStyles(["main"], meta, config) as ComputedRef<{
  main: string;
}>;
</script>
