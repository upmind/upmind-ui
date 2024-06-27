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

    <!-- pending items -->
    <aside
      :class="
        mergeStyles(
          styles.basket.items.content,
          styles.basket.items.pending.root
        )
      "
      v-if="!meta.isLoading && itemsPending?.length"
    >
      <header :class="styles.basket.items.pending.header">
        {{ $t("basket.items.pending.title") }}
      </header>

      <div :class="styles.basket.items.pending.content">
        <upm-basket-item
          v-for="(item, index) in itemsPending"
          :selected="index === 0"
          :key="item.id"
          :model-value="item.id"
          :item="item"
          :class="styles.basket.items.pending.item"
        />
      </div>
    </aside>

    <!-- configured items -->
    <div :class="styles.basket.items.content">
      <template v-if="!meta.isLoading && itemsConfigured?.length">
        <upm-basket-item
          v-for="item in itemsConfigured"
          :key="item.id"
          :model-value="item.id"
          :item="item"
        />
      </template>
    </div>

    <footer :class="styles.basket.items.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmBasketItem from "./Item.vue";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBaskeItemListings",
  components: { UpmBasketItem },
  props: {},
  setup() {
    const { meta, items, itemsPending, itemsConfigured } = useBasket();

    const styles = useStyles(
      ["basket.items", "basket.items.pending"],
      meta,
      config
    );

    // ---

    return {
      meta,
      items,
      itemsPending,
      itemsConfigured,
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {},
});
</script>
.
