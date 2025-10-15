<template>
  <nav v-if="meta.hasControls" :class="styles.control.root">
    <div :class="styles.control.container">
      <slot name="controls" />
      <slot name="navigation" />
      <slot name="actions" />
    </div>
  </nav>

  <article :class="cn(styles.split.root, props.class)">
    <header :class="styles.split.header.root" v-if="meta.hasHeader">
      <div :class="styles.split.header.container">
        <slot name="header" />
      </div>
    </header>

    <div :class="styles.split.content.root">
      <div :class="styles.split.content.container">
        <div :class="styles.split.main">
          <slot name="default" />

          <footer v-if="meta.hasFooter">
            <slot name="footer" />
          </footer>
        </div>

        <aside :class="styles.split.aside" v-if="meta.hasAside">
          <slot name="aside" />
          <slot name="aside-footer" />
        </aside>
      </div>
    </div>
  </article>

  <Teleport to="body">
    <div :class="styles.split.sticky.root">
      <div :class="styles.split.sticky.container">
        <slot name="sticky" />
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
// --- internal
import { useStyles } from "../../utils";
import config from "./layout.config";

// --- utils
import { isEmptySlot } from "./utils";
import { cn } from "../../utils";

// --- types
import { type ComputedRef, computed, useSlots, Teleport } from "vue";
import { type VariantProps } from "./types";

// -----------------------------------------------------------------------------
const props = defineProps<VariantProps>();

// -----------------------------------------------------------------------------

const slots = useSlots();

const meta = computed(() => {
  return {
    variant: "full",
    overflow: props.overflow,
    isSticky: props.sticky,
    hasHeader: !isEmptySlot("header", slots),
    hasContent: !isEmptySlot("default", slots),
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
  ["split", "control", "split.header", "split.content", "split.sticky"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  control: {
    root: string;
    container: string;
  };
  split: {
    root: string;
    controlsRoot: string;
    controls: string;
    header: {
      root: string;
      container: string;
    };
    content: {
      root: string;
      container: string;
    };
    aside: string;
    container: string;
    main: string;
    sticky: {
      root: string;
      container: string;
    };
  };
}>;
</script>
