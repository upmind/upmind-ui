<template>
  <div v-if="$slots.controls" :class="styles.enclosed.controlsRoot">
    <div :class="styles.enclosed.controls">
      <slot name="controls" />
    </div>
  </div>

  <section :class="cn(styles.enclosed.root, props.class)">
    <Card>
      <slot name="header" />
    </Card>

    <Card>
      <slot name="content" />
    </Card>
  </section>
</template>

<script lang="ts" setup>
// --- components
import Card from "../card/Card.ce.vue";

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
  ["enclosed"],
  {},
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  enclosed: {
    root: string;
    controlsRoot: string;
    controls: string;
  };
}>;
</script>
