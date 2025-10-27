<template>
  <div :class="styles.section.root">
    <header
      v-if="title || slots.title || slots.action"
      :class="styles.section.header"
    >
      <slot name="title">
        <h4 :class="styles.section.title">{{ title }}</h4>
      </slot>

      <slot name="action" />
    </header>

    <component
      :is="component"
      :class="cn(styles.section.content, props.class)"
      :aside="aside"
    >
      <slot name="default" />
    </component>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, useSlots } from "vue";

// --- components
import { Card } from "@upmind-automation/upmind-ui";

// --- internal
import { cn, useStyles } from "@upmind-automation/upmind-ui";
import config from "./content.config";

// --- types
import { type ComputedRef } from "vue";
import { type SectionProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SectionProps>(), {
  as: "section"
});

const slots = useSlots();

const meta = computed(() => {
  return {
    variant: props.variant || "default"
  };
});

const component = computed(() => {
  if (meta.value.variant === "enclosed" && props.as === "section") {
    return Card;
  }

  return props.as;
});

const styles = useStyles(
  "section",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  section: {
    root: string;
    header: string;
    title: string;
    content: string;
  };
}>;
</script>
