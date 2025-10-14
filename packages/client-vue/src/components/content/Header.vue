<template>
  <header class="flex flex-col gap-3">
    <Badge v-if="badge" v-bind="badge" variant="minimal" color="neutral" />

    <section :class="styles.header.root">
      <h1 :class="styles.header.title">
        <slot>
          <Sanitized v-if="props.title" :modelValue="props.title" />
        </slot>
      </h1>

      <p :class="styles.header.description">
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
import config from "./content.config";
import { useStyles, Sanitized } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { BadgeProps } from "@upmind-automation/upmind-ui";

const props = defineProps<{
  badge?: BadgeProps;
  title?: string;
  description?: string;
}>();

const styles = useStyles(["header"], {}, config) as ComputedRef<{
  header: {
    root: string;
    title: string;
    description: string;
  };
}>;
</script>
