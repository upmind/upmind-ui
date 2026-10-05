<template>
  <Root :class="splitRootVariants()">
    <article :class="splitContainerVariants()">
      <section>
        <slot name="controls" />
        <slot name="navigation" />
        <slot name="actions" />
        <slot name="content-header" />
        <slot name="aside" />
        <slot name="aside-footer" />
      </section>

      <slot name="content" />
      <slot name="default" />

      <!-- Footer -->
      <footer :class="splitFooterVariants()" />
    </article>

    <!-- Filler aside -->
    <div :class="splitAsideVariants()" />
  </Root>
</template>

<script lang="ts" setup>
import Root from "../components/root/Root.vue";
import {
  splitRootVariants,
  splitContainerVariants,
  splitFooterVariants,
  splitAsideVariants
} from "../variants";
import type { VariantProps } from "../types";

defineProps<VariantProps>();
</script>
