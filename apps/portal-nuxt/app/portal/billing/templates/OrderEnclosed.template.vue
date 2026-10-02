<template>
  <Card>
    <PageSection>
      <slot name="order-summary" />

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
  </Card>
</template>

<script setup lang="ts">
import { Card, PageAside, PageBody, PageSection } from "@upmind/ui";

defineOptions({ inheritAttrs: false });
</script>
