<template>
  <div :class="styles.control.root">
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
import { type ComputedRef, computed, useSlots } from "vue";
import { type VariantProps } from "./types";

// -----------------------------------------------------------------------------
const props = defineProps<VariantProps>();

// -----------------------------------------------------------------------------
const slots = useSlots();

const meta = computed(() => {
  return {
    hasControls: !isEmptySlot("controls", slots),
    hasHeader: !isEmptySlot("header", slots),
    hasContent: !isEmptySlot("default", slots),
    isMinimal: props.minimal
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
