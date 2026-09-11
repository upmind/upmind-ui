<template>
  <Root :class="canvasCardRootVariants()">
    <div :class="canvasCardContainerVariants()">
      <Card
        as="article"
        size="lg"
        :class="canvasCardCardVariants()"
        :ui="{ content: canvasCardBodyVariants() }"
      >
        <!-- Content Header -->
        <section :class="canvasCardContentHeaderVariants()">
          <slot name="controls" />
          <slot name="navigation" />
          <slot name="actions" />
          <slot name="content-header" />
          <slot name="aside" />
          <slot name="aside-footer" />
        </section>

        <!-- Content -->
        <section :class="canvasCardContentVariants()">
          <slot name="content" />
          <slot name="default" />
        </section>
      </Card>
    </div>
  </Root>
</template>

<script lang="ts" setup>
import { Card } from "@upmind/ui";
import Root from "../components/root/Root.vue";
import {
  canvasCardRootVariants,
  canvasCardContainerVariants,
  canvasCardCardVariants,
  canvasCardBodyVariants,
  canvasCardContentHeaderVariants,
  canvasCardContentVariants
} from "../variants";
import type { VariantProps } from "../types";

defineProps<VariantProps>();
</script>
