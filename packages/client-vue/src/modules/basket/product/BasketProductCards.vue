<template>
  <div v-if="!meta.isLoading" class="flex flex-col space-y-4">
    <template v-for="product in products" :key="product.id">
      <BasketProduct
        v-bind="product"
        :open="!!open[product.id]"
        :color="color"
        :disabled="meta.isProcessing()"
        :processing="meta.isProcessing(product.id)"
        :loading="meta.isLoading"
        @update:open="trackOpen(product.id, $event)"
        @remove="remove(product.id)"
        @update:quantity="updateQuantity(product.id, $event)"
        data-testid="basket-product"
      >
        <template #default="slotProps">
          <slot v-bind="slotProps" />
        </template>
      </BasketProduct>
    </template>
  </div>

  <div v-else class="flex flex-col space-y-4" v-auto-animate>
    <template
      v-for="index in Math.max(1, products.length)"
      :key="`skeleton-cart-item-${index}`"
    >
      <BasketProductSkeleton>
        <slot name="skeleton" />
      </BasketProductSkeleton>
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { ref, watch } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useBasketProducts } from "@upmind-automation/headless";
import BasketProduct from "./BasketProduct.vue";

// --- components
import { every, reduce, set } from "lodash-es";
import BasketProductSkeleton from "./BasketProductSkeleton.vue";

// --- types
import { type BasketProductCardsProps } from "./types";

const props = withDefaults(defineProps<BasketProductCardsProps>(), {
  color: "primary",
});

const emits = defineEmits(["update:open"]);

const { meta, products, updateQuantity, remove } = useBasketProducts();

const open = ref<Record<string, boolean>>(forceOpen(props.open));

function forceOpen(value: boolean = false): Record<string, boolean> {
  return reduce(
    products.value,
    (acc, item) => {
      set(acc, item.id, value);
      return acc;
    },
    {}
  );
}

function trackOpen(id: string, value: boolean) {
  open.value[id] = value;

  if (every(open.value)) {
    emits("update:open", true);
  } else if (every(open.value, v => !v)) {
    emits("update:open", false);
  }
}

watch(products, () => {
  open.value = forceOpen(props.open);
});

watch(
  () => props.open,
  () => {
    open.value = forceOpen(props.open);
  }
);
</script>
