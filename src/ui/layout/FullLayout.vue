<template>
  <header :class="styles.full.header.root">
    <div :class="styles.full.header.container">
      <slot name="header-left" />
      <slot name="header-right" />
    </div>
  </header>

  <nav v-if="meta.hasControls" :class="styles.control.root">
    <div :class="styles.control.container">
      <slot name="controls" />
      <slot name="navigation" />
      <slot name="actions" />
    </div>
  </nav>

  <article :class="cn(styles.full.root, props.class)">
    <section
      :class="styles.full.content.header.root"
      v-if="meta.hasContentHeader"
    >
      <div :class="styles.full.content.header.container">
        <slot name="content-header" />
      </div>
    </section>

    <section :class="styles.full.content.root">
      <div :class="styles.full.content.container">
        <div :class="styles.full.main">
          <slot name="default" />
          <slot name="content" />
        </div>

        <aside :class="styles.full.aside" v-if="meta.hasAside">
          <slot name="aside" />
          <slot name="aside-footer" />
        </aside>
      </div>
    </section>
  </article>

  <Footer>
    <template #footer-content>
      <slot name="footer-content" />
    </template>
    <template #footer-actions>
      <slot name="footer-actions" />
    </template>
    <template #footer-copyright>
      <slot name="footer-copyright" />
    </template>
  </Footer>
</template>

<script lang="ts" setup>
// --- internal
import { useStyles } from "../../utils";
import config from "./layout.config";

// --- components
import Footer from "./Footer.vue";

// --- utils
import { isEmptySlot } from "./utils";
import { cn } from "../../utils";

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
    overflow: props.overflow,
    isSticky: props.sticky,
    hasContentHeader: !isEmptySlot("content-header", slots),
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
  ["full", "control", "full.header", "full.content", "full.content.header"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  control: {
    root: string;
    container: string;
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
