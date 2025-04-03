<template>
  <main :class="cn(styles.page, props.class)">
    <Content>
      <slot></slot>
    </Content>
  </main>
</template>

<script lang="ts" setup>
// --- external

// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./content.config";
import Content from "./Content.vue";
// --- types
import type { HTMLAttributes, ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const styles = useStyles(["page"], {}, config) as ComputedRef<{
  page: string;
}>;
</script>
