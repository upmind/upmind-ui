<template>
  <header class="flex flex-col gap-3">
    <Badge v-if="badge" v-bind="badge" variant="outline" color="primary" />

    <article>
      <h1 :class="styles.header.title">
        {{ title }}
      </h1>

      <p :class="styles.header.description">
        <slot name="description">
          {{ description }}
        </slot>
      </p>
    </article>
  </header>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Badge } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./content.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { BadgeProps } from "@upmind-automation/upmind-ui";

defineProps<{
  badge?: BadgeProps;
  title?: string;
  description?: string;
}>();

const styles = useStyles(["header"], {}, config) as ComputedRef<{
  header: {
    title: string;
    description: string;
  };
}>;
</script>
