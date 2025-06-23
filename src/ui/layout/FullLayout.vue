<template>
  <div :class="styles.full.controlsRoot">
    <div :class="styles.full.controls">
      <slot name="controls" />
    </div>
  </div>

  <section :class="cn(styles.full.root, props.class)">
    <section :class="styles.full.header">
      <slot name="header" />
    </section>

    <section :class="styles.full.contentRoot">
      <div :class="styles.full.content">
        <slot name="content" />
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
// --- internal
import { cn, useStyles } from "../../utils";
import config from "./layout.config";

// --- types
import type { HTMLAttributes, ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  class?: HTMLAttributes["class"];
  uiConfig?: Record<string, any>;
}>();

const styles = useStyles(
  ["full"],
  {},
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  full: {
    root: string;
    controlsRoot: string;
    controls: string;
    header: string;
    contentRoot: string;
    content: string;
  };
}>;
</script>
