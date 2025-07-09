<template>
  <div :class="styles.default.controlsRoot" v-if="meta.hasControls">
    <div :class="styles.default.controls">
      <slot name="controls" />
    </div>
  </div>

  <article :class="cn(styles.default.root, props.class)">
    <section :class="styles.default.header" v-if="meta.hasHeader">
      <slot name="header" />
    </section>

    <section :class="styles.default.contentRoot">
      <div :class="styles.default.content">
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
  ["default"],
  {},
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  default: {
    root: string;
    controlsRoot: string;
    controls: string;
    header: string;
    contentRoot: string;
    content: string;
  };
}>;
</script>
