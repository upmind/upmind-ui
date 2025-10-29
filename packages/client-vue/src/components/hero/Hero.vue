<template>
  <header class="flex flex-col gap-3">
    <Badge v-if="badge" v-bind="badge" variant="minimal" color="neutral" />

    <section :class="styles.hero.root">
      <h1 :class="styles.hero.title">
        <slot>
          <Sanitized v-if="props.title" :modelValue="props.title" />
        </slot>
      </h1>

      <p :class="styles.hero.description">
        <slot name="description">
          {{ props.description }}
        </slot>
      </p>
    </section>
  </header>
</template>

<script setup lang="ts">
// --- external

// --- components
import { Badge } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./hero.config";
import { useStyles, Sanitized } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { BadgeProps } from "@upmind-automation/upmind-ui";

const props = defineProps<{
  badge?: BadgeProps;
  title?: string;
  description?: string;
}>();

const styles = useStyles(["hero"], {}, config) as ComputedRef<{
  hero: {
    root: string;
    title: string;
    description: string;
  };
}>;
</script>
