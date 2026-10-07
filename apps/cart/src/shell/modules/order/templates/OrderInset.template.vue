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
import { useConfig } from "@upmind-automation/headless";
import {
  FOOTER_LAYOUT,
  FOOTER_BACKGROUND
} from "../../../components/footer/types";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { useHeader } from "../../../components/header/useHeader";
import { onMounted } from "vue";

// --- internal
import { isMobile } from "@upmind-automation/foundation";
import { useFooter } from "../../../components/footer/useFooter";
import { useSection } from "@upmind-automation/foundation";
import { InsetLayout } from "@upmind-automation/foundation";

// --- components

// --- utils

// -----------------------------------------------------------------------------

const { ui } = useConfig();

defineOptions({
  inheritAttrs: false
});

// these sections are cards and draw the header inside the card; set at
// setup (like useLayout) so it applies before the child sections read it
useSection({ card: true, inset: true });

// A placed order can't change currency. Updates rather than resets so the
// layout's own footer chrome survives (child mounts first).
onMounted(() => {
  // Every step on this layout shares the same minimal chrome: a canvas header aligned to
  // the end (logo + Login/avatar) and a flat canvas footer.
  useHeader({
    background: HEADER_BACKGROUND.CANVAS,
    border: "none",
    items: "end",
    noBasket: ui.basketAction.isHidden
  });

  useFooter({
    layout: FOOTER_LAYOUT.FLAT,
    background: FOOTER_BACKGROUND.CANVAS,
    items: "end",
    justifyRight: "start"
  });

  useFooter().update({ noCurrency: true });
});
</script>
