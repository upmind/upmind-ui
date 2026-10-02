<template>
  <InsetLayout>
    <template #back>
      <slot name="back" />
    </template>

    <template #content>
      <!-- On mobile the aside column is hidden, so the summary stacks above the
           form. -->
      <CheckoutPricing v-if="isMobile" breakdown />
      <slot name="content" />
    </template>

    <template #aside>
      <CheckoutPricing breakdown />
      <slot name="markdown" />
    </template>
  </InsetLayout>
</template>

<script lang="ts" setup>
// --- components
import { isMobile } from "@upmind-automation/foundation";
import InsetLayout from "../../../components/layout/layouts/Inset.layout.vue";
import CheckoutPricing from "../../checkout/components/CheckoutPricing.vue";

// --- internal
import { useSection } from "@upmind-automation/foundation";

// --- utils

defineOptions({
  inheritAttrs: false
});

// these sections are cards and draw the header inside the card; set at
// setup (like useLayout) so it applies before the child sections read it
useSection({ card: true, inset: true });
</script>
