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

  <article :class="cn(styles.full.root, props.class)">
    <Section :class="styles.full.header" v-if="meta.hasHeader">
      <slot name="header" />
    </Section>

    <div :class="styles.full.contentRoot">
      <div :class="styles.full.container">
        <Section :class="styles.full.main" :title="title" variant="full">
          <slot name="default" />
        </Section>

        <Section
          as="aside"
          :class="styles.full.aside"
          v-if="meta.hasAside"
          :title="asideTitle"
          variant="full"
        >
          <slot name="aside" />
          <slot name="aside-footer" />
        </Section>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
// --- internal
import { cn, useStyles } from "../../utils";
import config from "./layout.config";

// --- components
import Section from "./Section.vue";

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
  ["full", "control"],
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
    header: string;
    contentRoot: string;
    content: string;
    aside: string;
    container: string;
    main: string;
  };
}>;
</script>
