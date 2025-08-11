<template>
  <div v-if="meta.hasControls" :class="styles.control.root">
    <nav :class="styles.control.content">
      <slot name="controls">
        <div>
          <slot name="navigation" />
        </div>

        <div>
          <slot name="actions" />
        </div>
      </slot>
    </nav>
  </div>

  <article :class="styles.full.root">
    <header :class="styles.full.header.root" v-if="meta.hasHeader">
      <section :class="styles.full.header.container">
        <slot name="header" />
      </section>
    </header>

    <div :class="styles.full.content.root">
      <div :class="styles.full.content.container">
        <main :class="styles.full.main">
          <slot name="default" />
        </main>

        <aside :class="styles.full.aside" v-if="meta.hasAside">
          <slot name="aside" />
          <slot name="aside-footer" />
        </aside>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
// --- internal
import { useStyles } from "../../utils";
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
    variant: "full",
    hasHeader: !isEmptySlot("header", slots),
    hasContent: !isEmptySlot("default", slots),
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
  ["full", "control", "full.header", "full.content"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  control: {
    root: string;
    content: string;
  };
  full: {
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
  };
}>;
</script>
