<template>
  <section :class="styles.basket.items.root">
    <header :class="styles.basket.items.header">
      <slot name="header" v-bind="{ meta }">
        <span :class="styles.basket.items.text">
          {{ t("basket.items.text", items?.length) }}
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

<script>
// --- external
import { defineComponent } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import { useBasket } from "@upmind-automation/headless-vue";
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- components
import BasketProduct from "./Item.vue";
import { findIndex } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "BaskeItemListings",
  components: { BasketProduct },
  directives: { autoAnimate: vAutoAnimate },
  props: {},
  setup() {
    const { t } = useI18n();
    const { meta, products, productsPending } = useBasket();

    const styles = useStyles(
      ["basket.items", "basket.items.pending", "basket.items.invalid"],
      meta,
      config
    );

    // ---

    return {
      t,
      meta,
      products,
      productsPending,

      // ---
      styles,
      cn,
    };
  },
  computed: {},
  methods: {
    isSelected(index) {
      const firstForcedIndex = findIndex(this.products, product => {
        const isNew = !product.state.value.context?.basketProduct;
        // const hasErrors = !!product.state.value.context?.errors;
        // const needsConfiguring = [
        //   "available.invalid",
        //   "available.valid",
        // ].some(product.state.value.matches);

        return isNew;
      });

      return index === firstForcedIndex;
    },
  },
});
</script>
.
