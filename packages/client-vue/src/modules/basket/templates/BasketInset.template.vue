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
// --- external
import { useConfig } from "@upmind-automation/headless";
import {
  FOOTER_LAYOUT,
  FOOTER_BACKGROUND
} from "../../../components/footer/types";
import { useFooter } from "../../../components/footer/useFooter";
import { HEADER_BACKGROUND } from "../../../components/header/types";
import { useHeader } from "../../../components/header/useHeader";
import { onMounted } from "vue";

// --- components

// --- internal
import { InsetLayout } from "@upmind-automation/foundation";
import { useSection } from "@upmind-automation/foundation";
import { isMobile } from "@upmind-automation/foundation";

// --- utils

const { ui } = useConfig();

defineOptions({
  inheritAttrs: false
});

// these sections are cards and draw the header inside the card; set at
// setup (like useLayout) so it applies before the child sections read it
useSection({ card: true, inset: true });

// Every step on this layout shares the same minimal chrome: a canvas header aligned to
// the end (logo + Login/avatar) and a flat canvas footer.
onMounted(() => {
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
});
</script>
