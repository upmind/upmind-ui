<template>
  <UpmContentSection class="mx-auto max-w-app" title="Product Catalogue">
    <div class="flex gap-2 pb-6" v-show="meta.isAvailable">
      <Button
        @click="refresh"
        size="sm"
        variant="tonal"
        :disabled="meta.isLoading"
      >
        Load
      </Button>
      <Button
        @click="invalidate"
        size="sm"
        variant="tonal"
        :disabled="meta.isLoading"
      >
        Invalidate
      </Button>
    </div>

    <Alert v-if="meta.isLoading" color="info" title="Loading..." />

    <Alert
      v-else-if="meta.hasError"
      color="error"
      title="Error loading products"
      :message="error?.message"
    />

    <Alert
      v-else-if="meta.isEmpty"
      color="info"
      title="No products found"
      message="Please add an product to get started."
    />

    <section
      v-else
      class="pb-3 md:pb-3"
      v-for="product in data"
      :key="product.id"
    >
      <UpmCard>
        <h3>{{ product.productDetails.title }}</h3>
        <p>{{ product.productDetails.description }}</p>
      </UpmCard>
    </section>
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external
// --- internal
import { useProductCatalogue } from "@upmind-automation/headless";

// --- components
import { Button, Alert } from "@upmind-automation/upmind-ui";
import { UpmCard, UpmContentSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const { data, meta, error, invalidate, refresh } = useProductCatalogue();
</script>
