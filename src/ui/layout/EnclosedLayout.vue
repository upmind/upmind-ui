<template>
  <div v-if="meta.hasControls" :class="styles.control.root">
    <nav :class="styles.control.content">
      <div>
        <slot name="controls" />
        <slot name="navigation" />
      </div>

      <div>
        <slot name="actions" />
      </div>
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
    hasControls:
      !isEmptySlot("controls", slots) ||
      !isEmptySlot("navigation", slots) ||
      !isEmptySlot("actions", slots),
    hasHeader: !isEmptySlot("header", slots),
    hasContent: !isEmptySlot("default", slots)
  };
});

const styles = useStyles(
  ["enclosed", "control"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  control: {
    root: string;
    content: string;
  };
  enclosed: {
    root: string;
  };
}>;
</script>
