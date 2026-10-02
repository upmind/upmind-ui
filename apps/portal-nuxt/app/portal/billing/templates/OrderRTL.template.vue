<template>
  <PageSection>
    <slot name="order-summary" />

    <PageBody aside="left">
      <PageSection>
        <slot name="order-payment-details" />
        <slot name="order-products" />
        <slot name="guest-registration" />
      </PageSection>

      <!-- Written after the content so it stacks last below lg, as PortalContent's left aside does. -->
      <PageAside ariaLabel="Order details" sticky class="lg:order-first">
        <slot name="order-details" />
      </PageAside>
    </PageBody>
  </PageSection>
</template>

<script setup lang="ts">
import { PageAside, PageBody, PageSection } from "@upmind/ui";

defineOptions({ inheritAttrs: false });
</script>
