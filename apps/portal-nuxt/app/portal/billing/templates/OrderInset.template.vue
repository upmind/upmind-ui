<template>
  <PageSection>
    <slot name="order-summary" />

    <!-- Below lg the aside stacks under the content, so the order details sit inline there. -->
    <PageBody aside="right">
      <PageSection>
        <slot name="order-payment-details" />
        <slot name="order-products" />
        <slot name="guest-registration" />
      </PageSection>

      <PageAside ariaLabel="Order details" sticky>
        <slot name="order-details" />
      </PageAside>
    </PageBody>
  </PageSection>
</template>

<script setup lang="ts">
import { PageAside, PageBody, PageSection } from "@upmind/ui";

defineOptions({ inheritAttrs: false });
</script>
