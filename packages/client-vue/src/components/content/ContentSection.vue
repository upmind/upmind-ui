<template>
  <section :class="cn(styles.section.root, props.class)">
    <header
      :class="cn(styles.section.header, props.classHeader)"
      v-if="title || tagline || $slots.header || $slots.title"
    >
      <slot name="header">
        <h3 :class="cn(styles.section.title, props.classTitle)">
          <slot name="title">{{ title }}</slot>
        </h3>
        <slot name="option">
          <div :class="styles.section.tagline">
            {{ tagline }}
          </div>
        </slot>
      </slot>
    </header>

    <div :class="cn(styles.section.content, props.classContent)">
      <slot />
    </div>

    <footer
      v-if="$slots.footer"
      :class="cn(styles.section.footer, props.classFooter)"
    >
      <slot name="footer"></slot>
    </footer>
  </section>
</template>

<script setup lang="ts">
// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./content.config";

// --- types
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<{
  title?: string;
  tagline?: string;
  class?: HTMLAttributes["class"];
  classHeader?: HTMLAttributes["class"];
  classTitle?: HTMLAttributes["class"];
  classContent?: HTMLAttributes["class"];
  classFooter?: HTMLAttributes["class"];
}>();

const styles = useStyles(["section"], {}, config);
</script>
