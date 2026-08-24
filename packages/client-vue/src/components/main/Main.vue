<template>
  <main :class="cn(mainVariants({ mode, overflow }), props.class)">
    <slot />
  </main>
</template>

<script lang="ts" setup>
import { cn } from "@upmind/ui";
import { useLayout } from "../layout/useLayout";
import { mainVariants } from "./variants";
import type { MainProps } from "./types";

// -----------------------------------------------------------------------------
const props = defineProps<MainProps>();

const { mode, overflow } = useLayout();
</script>
