<template>
  <div :class="cn(rootVariants({ overflow }), props.class)">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { cn } from "@upmind/ui";
import { useLayout } from "../../useLayout";
import { rootVariants } from "./variants";
import type { HTMLAttributes } from "vue";

// --- types

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const { overflow } = useLayout();
</script>
