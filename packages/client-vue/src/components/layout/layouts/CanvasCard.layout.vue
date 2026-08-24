<template>
  <Root :class="canvasCardRootVariants()">
    <div :class="canvasCardContainerVariants()">
      <CardRoot
        as="article"
        :class="canvasCardCardVariants()"
        class="p-8 lg:p-18"
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
      </CardRoot>
    </div>
  </Root>
</template>

<script lang="ts" setup>
import { CardRoot } from "@upmind/ui";
import Root from "../components/root/Root.vue";
import {
  canvasCardRootVariants,
  canvasCardContainerVariants,
  canvasCardCardVariants,
  canvasCardContentHeaderVariants,
  canvasCardContentVariants
} from "../variants";
import type { VariantProps } from "../types";

defineProps<VariantProps>();
</script>
