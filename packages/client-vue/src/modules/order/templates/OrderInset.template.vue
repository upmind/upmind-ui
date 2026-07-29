<template>
  <!-- Mirrors Enclosed's positioning — summary as a full-width header row,
       payment + products left, order details aside — with the one-page chrome. -->
  <InsetLayout>
    <template #header>
      <slot name="order-summary" />
    </template>

    <template #content>
      <slot name="order-payment-details" />
      <slot name="order-products" />
      <slot name="guest-registration" />
      <!-- On mobile the aside column is hidden, so the order details stack
           under the products. -->
      <slot v-if="isMobile" name="order-details" />
    </template>

    <template #aside>
      <slot name="order-details" />
    </template>
  </InsetLayout>
</template>

<script lang="ts" setup>
// --- external
import { onMounted } from "vue";

// --- internal
import { useFooter } from "../../../components/footer/useFooter";
import { useSection } from "../../../components/section/useSection";

// --- components
import InsetLayout from "../../../components/layout/layouts/Inset.layout.vue";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

defineOptions({
  inheritAttrs: false
});

// these sections are cards and draw the header inside the card; set at
// setup (like useLayout) so it applies before the child sections read it
useSection({ card: true, inset: true });

// A placed order can't change currency. Updates rather than resets so the
// layout's own footer chrome survives (child mounts first).
onMounted(() => {
  useFooter().update({ noCurrency: true });
});
</script>
