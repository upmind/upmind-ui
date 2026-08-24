<template>
  <!-- Your Order — the first wizard step: no Back. Products left, summary +
       Continue aside right. On mobile the aside column is hidden, so the summary
       (with its Continue) stacks below the products. -->
  <InsetLayout>
    <template #content>
      <slot name="products" />
      <template v-if="isMobile">
        <slot name="pricing" />
        <slot name="custom-price" />
      </template>
    </template>

    <template #aside>
      <slot name="pricing" />
      <slot name="custom-price" />
      <slot name="markdown" />
    </template>
  </InsetLayout>
</template>

<script lang="ts" setup>
// --- components
import InsetLayout from "../../../components/layout/layouts/Inset.layout.vue";

// --- internal
import { useSection } from "../../../components/section/useSection";

// --- utils
import { isMobile } from "../../../composables/isMobile";

defineOptions({
  inheritAttrs: false
});

// these sections are cards and draw the header inside the card; set at
// setup (like useLayout) so it applies before the child sections read it
useSection({ card: true, inset: true });
</script>
