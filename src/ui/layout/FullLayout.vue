<template>
  <div :class="styles.full.controlsRoot" v-if="meta.hasControls">
    <div :class="styles.full.controls">
      <slot name="controls" />
    </div>
  </div>

  <article :class="cn(styles.full.root, props.class)">
    <section :class="styles.full.header" v-if="meta.hasHeader">
      <slot name="header" />
    </section>

    <section :class="styles.full.contentRoot">
      <div :class="styles.full.content">
        <slot name="default" />
      </div>
    </section>
  </article>
</template>

<script lang="ts" setup>
// --- internal
import { cn, useStyles } from "../../utils";
import config from "./layout.config";

// --- utils
import { isEmptySlot } from "./utils";

// --- types
import { type HTMLAttributes, type ComputedRef, computed, useSlots } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  class?: HTMLAttributes["class"];
  uiConfig?: Record<string, any>;
}>();

// -----------------------------------------------------------------------------

const slots = useSlots();

const meta = computed(() => {
  return {
    hasControls: !isEmptySlot("controls", slots),
    hasHeader: !isEmptySlot("header", slots),
    hasContent: !isEmptySlot("default", slots)
  };
});
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
