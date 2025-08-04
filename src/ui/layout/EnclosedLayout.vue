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

  <section :class="cn(styles.enclosed.root, props.class)">
    <article :class="styles.enclosed.main">
      <Card v-if="meta.hasHeader" as="header">
        <slot name="header" />
      </Card>

      <Card>
        <slot name="default" />
      </Card>

      <slot name="footer" />
    </article>

    <aside v-if="meta.hasAside" :class="styles.enclosed.aside">
      <Card>
        <slot name="aside" />
      </Card>

      <slot name="aside-footer" />
    </aside>
  </section>
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
    hasControls:
      !isEmptySlot("controls", slots) ||
      !isEmptySlot("navigation", slots) ||
      !isEmptySlot("actions", slots),
    hasHeader: !isEmptySlot("header", slots),
    hasContent: !isEmptySlot("default", slots),
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
    content: string;
  };
  enclosed: {
    root: string;
    main: string;
    aside: string;
  };
}>;
</script>
