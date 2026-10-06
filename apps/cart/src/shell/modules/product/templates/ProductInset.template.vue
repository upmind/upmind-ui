<template>
  <InsetLayout>
    <template #header>
      <Card>
        <slot name="product-details" />
      </Card>
    </template>

    <template #content>
      <slot name="configuration" />
      <!-- On mobile the aside column is hidden, so the config summary (with its
           CTA + quantity) and trust messaging stack under the form. -->
      <template v-if="isMobile">
        <slot name="pricing" :show-total="true" :show-actions="true" />
        <slot name="errors" />
        <slot name="markdown" />
      </template>
    </template>

    <template #aside>
      <slot name="pricing" :show-total="true" :show-actions="true" />
      <slot name="errors" />
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
import { Card } from "@upmind/ui";

// --- internal
import { InsetLayout } from "@upmind-automation/foundation";
import { useSection } from "@upmind-automation/foundation";

// --- utils
import { isMobile } from "@upmind-automation/foundation";

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
