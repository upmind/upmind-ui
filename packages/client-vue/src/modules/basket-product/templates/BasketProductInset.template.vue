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
        <slot name="pricing" />
        <slot name="errors" />
        <slot name="markdown" />
      </template>
    </template>

    <template #aside>
      <slot name="pricing" />
      <slot name="errors" />
      <slot name="markdown" />
    </template>
  </InsetLayout>
</template>

<script lang="ts" setup>
// --- components
import InsetLayout from "../../../components/layout/layouts/Inset.layout.vue";
import { Card } from "@upmind-automation/upmind-ui";

// --- internal
import { useSection } from "../../../components/section/useSection";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";

defineOptions({
  inheritAttrs: false
});

// these sections are cards and draw the header inside the card; set at
// setup (like useLayout) so it applies before the child sections read it
useSection({ card: true, inset: true });
</script>
