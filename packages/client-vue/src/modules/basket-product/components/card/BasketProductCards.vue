<template>
  <!-- Suspense covers the async setup gap in BasketProduct -->
  <Suspense v-if="basketMeta.isAvailable">
    <!-- v-auto-animate mounts only after Suspense resolves, so the initial
         skeleton → cards swap is instant; later add/remove animates. -->
    <div v-auto-animate :class="styles.product.list">
      <BasketProduct
        v-for="product in products"
        :key="product.id"
        v-bind="product"
        :open="!!open[product.id]"
        :processing="meta.isProcessing(product.id)"
        @update:open="trackOpen(product.id, $event)"
        @remove="remove(product.id)"
        @update:quantity="updateQuantity(product.id, $event)"
        data-testid="basket-product"
        :edit-route="props.editRoute"
      >
        <template #default="slotProps">
          <slot v-bind="slotProps" />
        </template>
      </BasketProduct>
    </div>

    <template #fallback>
      <div :class="styles.product.list">
        <BasketProductSkeleton
          v-for="index in Math.max(1, products?.length ?? 0)"
          :key="`skeleton-cart-item-${index}`"
        >
          <slot name="skeleton" />
        </BasketProductSkeleton>
      </div>
    </template>
  </Suspense>

  <!-- Suspense fallback can't cover this: no products = no pending state -->
  <div v-else :class="styles.product.list">
    <BasketProductSkeleton>
      <slot name="skeleton" />
    </BasketProductSkeleton>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { ref, watch } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useBasketProducts, useBasket } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";
import BasketProduct from "./BasketProduct.vue";

// --- components
import { every, reduce, set } from "lodash-es";
import BasketProductSkeleton from "./BasketProductSkeleton.vue";

// --- types
import { type BasketProductCardsProps } from "./types";

const props = withDefaults(defineProps<BasketProductCardsProps>(), {
  open: false
});

const emits = defineEmits(["update:open"]);

const { meta, products, updateQuantity, remove } = useBasketProducts();
const { meta: basketMeta } = useBasket();

const styles = useStyles(["product.list"], {}, config);

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

watch(
  products,
  () => {
    open.value = forceOpen(props.open);
  },
  { immediate: true }
);

watch(
  () => props.open,
  () => {
    open.value = forceOpen(props.open);
  }
);
</script>
