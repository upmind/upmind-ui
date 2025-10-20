<template>
  <nav v-if="meta.hasControls" :class="styles.control.root">
    <div :class="styles.control.container">
      <slot name="controls" />
      <slot name="navigation" />
      <slot name="actions" />
    </div>
  </nav>

  <article :class="cn(styles.enclosed.root, props.class)">
    <div :class="styles.enclosed.container">
      <Card v-if="meta.hasHeader" as="header">
        <slot name="content-header" />
      </Card>

      <div :class="styles.enclosed.content">
        <div :class="styles.enclosed.main">
          <slot name="default" />

          <footer v-if="meta.hasFooter">
            <slot name="footer" />
          </footer>
        </div>

        <aside v-if="meta.hasAside" :class="styles.enclosed.aside">
          <slot name="aside" />

          <slot name="aside-footer" />
        </aside>
      </div>
    </div>
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
    variant: "enclosed",
    overflow: props.overflow,
    isSticky: props.sticky,
    hasControls:
      !isEmptySlot("controls", slots) ||
      !isEmptySlot("navigation", slots) ||
      !isEmptySlot("actions", slots),
    hasHeader: !isEmptySlot("content-header", slots),
    hasContent: !isEmptySlot("default", slots),
    hasFooter: !isEmptySlot("footer", slots),
    hasAside:
      !isEmptySlot("aside", slots) || !isEmptySlot("aside-footer", slots),
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
    container: string;
  };
  enclosed: {
    root: string;
    container: string;
    main: string;
    content: string;
    aside: string;
  };
}>;
</script>
