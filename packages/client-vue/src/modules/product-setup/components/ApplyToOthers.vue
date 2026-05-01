<template>
  <div v-if="loading" class="flex flex-col gap-2 border-t pt-4">
    <Skeleton class="h-6 w-full" />
    <Skeleton class="h-6 w-3/4" />
  </div>
  <div v-else-if="products.length" class="flex flex-col gap-2 border-t pt-4">
    <CheckboxGroup v-model="selected" multiple :disabled="disabled">
      <CheckboxGroupItem
        v-for="product in products"
        :key="product.id"
        :value="product.id"
        :disabled="disabled"
      >
        <i18n-t keypath="cart.product_setup.use_details_for" tag="span">
          <template #name>
            <strong>{{
              product.serviceIdentifier || product.productDetails?.title
            }}</strong>
          </template>
        </i18n-t>
      </CheckboxGroupItem>
    </CheckboxGroup>
  </div>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  CheckboxGroup,
  CheckboxGroupItem,
  Skeleton
} from "@upmind-automation/upmind-ui";

// --- types
import type { BasketProduct } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

defineProps<{
  products: BasketProduct[];
  disabled?: boolean;
  loading?: boolean;
}>();

const selected = defineModel<string[]>({ default: () => [] });

const { t } = useI18n();
</script>
