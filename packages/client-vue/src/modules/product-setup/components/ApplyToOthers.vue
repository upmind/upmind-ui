<template>
  <div v-if="loading" class="flex flex-col gap-2 border-t pt-4">
    <Skeleton class="h-6 w-full" />
    <Skeleton class="h-6 w-3/4" />
  </div>
  <div
    v-else-if="products.length"
    class="flex flex-col gap-2 border-t pt-4"
    v-bind="groupTestAttrs"
    role="group"
  >
    <label
      v-for="product in products"
      :key="product.id"
      class="flex cursor-pointer items-start gap-2"
      :class="disabled && 'cursor-not-allowed opacity-50'"
    >
      <Checkbox
        :model-value="selected.includes(product.id)"
        :disabled="disabled"
        class="mt-0.5"
        @update:model-value="checked => toggle(product.id, checked)"
      />
      <i18n-t keypath="cart.product_setup_msg" tag="span" class="text-sm">
        <template #name>
          <strong>{{
            product.serviceIdentifier || product.productDetails?.title
          }}</strong>
        </template>
      </i18n-t>
    </label>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useTestAttrs } from "@upmind/ui";
import { Checkbox, Skeleton } from "@upmind/ui";
import type { BasketProduct } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

defineProps<{
  products: BasketProduct[];
  disabled?: boolean;
  loading?: boolean;
}>();

const selected = defineModel<string[]>({ default: () => [] });

const groupTestAttrs = useTestAttrs({ key: "apply-to-others-group" });

const { t: _t } = useI18n();

function toggle(id: string, checked: boolean | "indeterminate") {
  const next = selected.value.filter(value => value !== id);
  if (checked === true) next.push(id);
  selected.value = next;
}
</script>
