<template>
  <header class="flex flex-col gap-3">
    <Badge v-if="badge" v-bind="badge" variant="minimal" color="neutral" />

    <section :class="styles.hero.root">
      <slot name="prepend" />

      <h1 :class="styles.hero.title">
        <slot name="title">
          <Sanitized v-if="props.title" :modelValue="props.title" />
        </slot>
      </h1>

      <p v-if="!props.loading" :class="styles.hero.description">
        <slot name="description">
          {{ props.description }}
        </slot>
      </p>

      <Skeleton v-else class="h-7 w-96" />

      <slot name="append" />
    </section>

    <slot />
  </header>
</template>

<script setup lang="ts">
// --- components
import { Badge, Skeleton } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./hero.config";
import { useStyles, Sanitized } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { HeroProps } from "./types";

const props = defineProps<HeroProps>();

const styles = useStyles(["hero"], {}, config) as ComputedRef<{
  hero: {
    root: string;
    title: string;
    description: string;
  };
}>;
</script>
