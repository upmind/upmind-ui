<template>
  <!-- basket still loading: no products to await yet, so no boundary either -->
  <BasketProductSkeletons v-if="meta.isLoading" :card="!sectionCard">
    <slot name="skeleton" />
  </BasketProductSkeletons>

  <!-- BasketProduct pauses in setup to spawn its config machine (a top-level
       await), so Vue cannot finish rendering it on the spot. A component that
       pauses needs a parent that knows how to wait and what to show meanwhile;
       Suspense is that parent. It sits here rather than in the page so only
       this list waits, and its @resolve doubles as the cue that the cards
       reached the DOM (Basket.vue scrolls to ?product on it).
       The gate is on the Suspense, not on the cards, because Vue renders
       #fallback on a fresh mount only: a boundary mounted over an empty basket
       resolves at once — firing @resolve before any card exists, then showing
       nothing while the cards it should have waited for load. -->
  <Suspense v-else @resolve="emits('resolve')">
    <!-- outer div isolates the items+tax pair from the parent's own flex gap;
         the inner one carries the per-mode item rhythm (cards vs dashed rows) -->
    <div :class="styles.product.list">
      <div :class="styles.product.items">
        <template v-for="product in products" :key="product.id">
          <BasketProduct
            v-bind="{ ...product, ...basketProductTestAttrs }"
            :open="!!open[product.id]"
            :processing="meta.isProcessing(product.id)"
            :loading="meta.isLoading"
            @update:open="trackOpen(product.id, $event)"
            @remove="remove(product.id)"
            @update:quantity="updateQuantity(product.id, $event)"
            :edit-route="props.editRoute"
            :card="!sectionCard"
            :disabled="props.disabled"
          >
            <template #default="slotProps">
              <slot v-bind="slotProps" />
            </template>
          </BasketProduct>
        </template>
      </div>

      <p v-if="meta.hasProducts" :class="styles.product.tax">
        {{
          includesTax
            ? t("text.prices_shown_include_taxes")
            : t("text.prices_shown_exclude_taxes")
        }}
      </p>
    </div>

    <template #fallback>
      <BasketProductSkeletons :card="!sectionCard">
        <slot name="skeleton" />
      </BasketProductSkeletons>
    </template>
  </Suspense>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useBasketProducts, useBrand } from "@upmind-automation/headless";
import { useStyles, useTestAttrs } from "@upmind-automation/upmind-ui";
import { useSection } from "../../../../components/section/useSection";
import config from "./basketProduct.config";
import BasketProduct from "./BasketProduct.vue";
import BasketProductSkeletons from "./BasketProductSkeletons.vue";
import { every, reduce, set } from "lodash-es";
import type { BasketProductCardsProps } from "./types";

// --- types

const props = withDefaults(defineProps<BasketProductCardsProps>(), {
  open: false
});

const emits = defineEmits(["update:open", "resolve"]);

const { t } = useI18n();
const { meta, products, updateQuantity, remove } = useBasketProducts();
const { includesTax } = useBrand();

const { card: sectionCard } = useSection();

const styles = useStyles(
  ["product.tax", "product.items", "product.list"],
  computed(() => ({ card: !sectionCard.value })),
  config
);

// --- test attrs

const basketProductTestAttrs = useTestAttrs({ key: "basket-product" });

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
