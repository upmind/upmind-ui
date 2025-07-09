<template>
  <div :class="styles.enclosed.controlsRoot" v-if="meta.hasControls">
    <nav :class="styles.enclosed.controls">
      <slot name="controls" />
    </nav>
  </div>

  <article :class="cn(styles.enclosed.root, props.class)">
    <Card v-if="meta.hasHeader">
      <slot name="header" />
    </Card>

    <Card>
      <slot name="default" />
    </Card>
  </article>
</template>

<script lang="ts" setup>
// --- components
import Card from "../card/Card.ce.vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./layout.config";

// --- utils
import { isEmptySlot } from "./utils";

// --- types
import { type HTMLAttributes, type ComputedRef, computed } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  class?: HTMLAttributes["class"];
  uiConfig?: Record<string, any>;
}>();

// -----------------------------------------------------------------------------

const meta = computed(() => {
  return {
    hasControls: !isEmptySlot("controls"),
    hasHeader: !isEmptySlot("header"),
    hasContent: !isEmptySlot("default")
  };
});

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
