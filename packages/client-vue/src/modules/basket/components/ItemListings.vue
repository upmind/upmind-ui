<template>
  <section :class="styles.basket.items.root">
    <header :class="styles.basket.items.header">
      <slot name="header" v-bind="{ meta }">
        <span :class="styles.basket.items.text">
          {{ t("basket.items.text", products?.length) }}
        </span>

        <h1 :class="styles.basket.items.title">
          {{ t("basket.items.title") }}
        </h1>
      </slot>
    </header>

    <!-- items -->
    <div
      :class="styles.basket.items.content"
      v-if="!meta.isLoading"
      v-auto-animate
    >
      <BasketProduct
        v-for="(product, index) in products"
        :key="`product-${product.id}-${index}`"
        :model-value="product.id"
        :item="product"
        :selected="isSelected(index)"
      />
    </div>

    <footer :class="styles.basket.items.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasket } from "@upmind-automation/headless-vue";
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "./basket.config";

// --- components
import BasketProduct from "./Item.vue";
import { findIndex } from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const { t } = useI18n();
const { meta, products } = useBasket();

const styles = useStyles(
  ["basket.items", "basket.items.pending", "basket.items.invalid"],
  meta,
  config
) as ComputedRef<{
  basket: {
    items: {
      root: string;
      header: string;
      content: string;
      footer: string;
      text: string;
      title: string;
    };
  };
}>;

// ---

function isSelected(index: number) {
  const firstForcedIndex = findIndex(products, (product: ActorRef<any>) => {
    const isNew = !product.getSnapshot().context?.basketProduct;
    // const hasErrors = !!product.state.value.context?.errors;
    // const needsConfiguring = [
    //   "available.invalid",
    //   "available.valid",
    // ].some(product.state.value.matches);

    return isNew;
  });

  return index === firstForcedIndex;
}
</script>
