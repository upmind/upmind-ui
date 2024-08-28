<template>
  <section :class="styles.basket.items.root">
    <header :class="styles.basket.items.header">
      <slot name="header" v-bind="{ meta }">
        <span :class="styles.basket.items.text">
          {{ $tc("basket.items.text", items?.length) }}
        </span>

        <h1 :class="styles.basket.items.title">
          {{ $t("basket.items.title") }}
        </h1>
      </slot>
    </header>

    <!-- items -->
    <div
      :class="styles.basket.items.content"
      v-if="!meta.isLoading"
      v-auto-animate
    >
      <upm-basket-item
        v-for="(item, index) in items"
        :key="`item-${item.id}-${index}`"
        :model-value="item.id"
        :item="item"
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

// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmBasketItem from "./Item.vue";
import { findIndex } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBaskeItemListings",
  components: { UpmBasketItem },
  directives: { autoAnimate: vAutoAnimate },
  props: {},
  setup() {
    const { meta, items, itemsPending, itemsInvalid, itemsConfigured } =
      useBasket();

    const styles = useStyles(
      ["basket.items", "basket.items.pending", "basket.items.invalid"],
      meta,
      config
    );

    // ---

    return {
      meta,
      items,
      itemsPending,
      itemsInvalid,
      itemsConfigured,
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {},
  methods: {
    isSelected(index) {
      const firstForcedIndex = findIndex(this.items, item => {
        const needsConfiguring = [
          "available.configuring",
          "available.configured",
        ].some(item.state.value.matches);

        const isNew = !item.state.value.context?.basket_product;
        const hasErrors = !!item.state.value.context?.errors;

        return needsConfiguring && (isNew || hasErrors);
      });

      return index === firstForcedIndex;
    },
  },
});
</script>
.
