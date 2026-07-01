<template>
  <main :class="cn(styles.main, props.class)">
    <slot />
  </main>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import { useLayout } from "../layout/useLayout";
import config from "./main.config";
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
