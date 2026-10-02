<template>
  <LayoutProvider>
    <slot :template="template" />

    <template #product-details>
      <p data-piece="default-product-details" :data-plan="plan">
        product-details
      </p>
    </template>

    <template #image>
      <p data-piece="default-image" :data-plan="plan">image</p>
    </template>

    <template #pricing>
      <p data-piece="default-pricing" :data-plan="plan">pricing</p>
    </template>
  </LayoutProvider>
</template>

<script lang="ts" setup>
import { LayoutProvider } from "../index";

withDefaults(defineProps<{ plan?: string }>(), { plan: "Starter" });

const template = "two-column-ltr";
</script>
