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
import type { MainProps } from "./types";

// -----------------------------------------------------------------------------
const props = defineProps<MainProps>();

const { mode, overflow } = useLayout();

const meta = computed(() => ({
  mode: mode.value,
  overflow: overflow.value
}));

const styles = useStyles(["main"], meta, config);
</script>
