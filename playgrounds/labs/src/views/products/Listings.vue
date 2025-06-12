<template>
  <UpmContentSection class="mx-auto max-w-app" title="Product Catalogue">
    <div class="flex gap-2 pb-6" v-show="meta.isAvailable">
      <Button
        @click="refresh"
        size="sm"
        variant="tonal"
        :disabled="meta.isLoading"
      >
        Refetch Products
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
      <UpmCard v-if="product?.productDetails">
        <h3>{{ product.productDetails.title }}</h3>
        <p>{{ product.productDetails.description }}</p>
        <Button
          @click="goToProductDetail(product.productDetails.id)"
          size="sm"
          variant="primary"
        >
          View Details
        </Button>
      </UpmCard>
    </section>
  </UpmContentSection>
</template>

<script lang="ts" setup>
// --- external
// --- internal
import { useRouter } from "vue-router";

const router = useRouter();
import { useProductCatalogue } from "@upmind-automation/headless";

// --- components
import { Button, Alert } from "@upmind-automation/upmind-ui";
import { UpmCard, UpmContentSection } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

function goToProductDetail(productId: string) {
  router.push({ name: "products.catalogue.detail", params: { id: productId } });
}

const { data, meta, error, refresh } = useProductCatalogue();
</script>
