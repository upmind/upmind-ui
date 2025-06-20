<template>
  <section
    :class="cn(styles.section.root, props.class)"
    :data-testid="`card-container-${kebabCase(props.title)}`"
  >
    <header
      :class="styles.section.header"
      v-if="title || tagline || $slots.header || $slots.title"
    >
      <slot name="header">
        <h3 :class="styles.section.title">
          <slot name="title">
            {{ title }}
          </slot>
        </h3>
        <slot name="option">
          <div v-if="tagline" :class="styles.section.tagline">
            {{ tagline }}
          </div>
        </slot>
      </slot>
    </header>

    <div :class="styles.section.content">
      <slot />
    </div>

    <footer v-if="$slots.footer" :class="styles.section.footer">
      <slot name="footer"></slot>
    </footer>
  </section>
</template>

<script setup lang="ts">
// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./content.config";
import { kebabCase } from "lodash-es";

// --- types
import type { HTMLAttributes, ComputedRef } from "vue";
import type { ContentSectionProps } from "./types";

// -----------------------------------------------------------------------------
const props = defineProps<ContentSectionProps>();

const styles = useStyles(["section"], {}, config, {
  section: props.uiConfig,
}) as ComputedRef<{
  section: {
    root: string;
    header: string;
    title: string;
    tagline: string;
    content: string;
    footer: string;
  };
}>;
</script>
