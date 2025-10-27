<template>
  <nav v-if="meta.hasControls" :class="styles.control.root">
    <div :class="styles.control.container">
      <slot name="controls" />
      <slot name="navigation" />
      <slot name="actions" />
    </div>
  </nav>

  <article :class="cn(styles.default.root, props.class)">
    <section
      :class="styles.default.content.header.root"
      v-if="meta.hasContentHeader"
    >
      <div :class="styles.default.content.header.container">
        <slot name="content-header" />
      </div>
    </section>

    <section v-if="meta.hasContent" :class="styles.default.content.root">
      <div :class="styles.default.content.container">
        <div :class="styles.default.main">
          <slot name="default" />
          <slot name="content" />
        </div>

        <aside :class="styles.default.aside" v-if="meta.hasAside">
          <slot name="aside" />
          <slot name="aside-footer" />
        </aside>
      </div>
    </section>
  </article>
</template>

<script lang="ts" setup>
// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../layout.config";

// --- utils
import { isEmptySlot } from "../utils.ts";
import { cn } from "@upmind-automation/upmind-ui";

// --- types
import { type ComputedRef, computed, useSlots } from "vue";
import { type VariantProps } from "../types";

// -----------------------------------------------------------------------------
const props = defineProps<VariantProps>();

// -----------------------------------------------------------------------------

const slots = useSlots();

const meta = computed(() => {
  return {
    variant: "full",
    overflow: props.overflow,
    hasContentHeader: !isEmptySlot("content-header", slots),
    hasContent:
      !isEmptySlot("default", slots) || !isEmptySlot("content", slots),
    hasFooter: !isEmptySlot("footer", slots),
    isMinimal: props.minimal,
    hasControls:
      !isEmptySlot("controls", slots) ||
      !isEmptySlot("navigation", slots) ||
      !isEmptySlot("actions", slots),
    hasAside:
      !isEmptySlot("aside", slots) || !isEmptySlot("aside-footer", slots)
  };
});
const styles = useStyles(
  [
    "default",
    "control",
    "default.header",
    "default.content",
    "default.content.header"
  ],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  control: {
    root: string;
    container: string;
  };
  default: {
    root: string;
    controlsRoot: string;
    controls: string;
    header: {
      root: string;
      container: string;
    };
    content: {
      header: {
        root: string;
        container: string;
      };
      root: string;
      container: string;
    };
    aside: string;
    container: string;
    main: string;
  };
}>;
</script>
