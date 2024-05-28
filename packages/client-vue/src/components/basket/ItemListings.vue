<template>
  <section
    :class="styles.basket.items.root"
    :disabled="!meta.hasProducts || !meta.hasAccount"
  >
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

    <div :class="styles.basket.items.content">
      <aside
        :class="styles.basket.items.invalid.root"
        v-if="!meta.isLoading && itemsPending?.length"
      >
        <header :class="styles.basket.items.invalid.header">
          {{ $t("basket.items.invalid.title") }}
        </header>

        <upm-basket-item
          v-for="item in itemsPending"
          :key="item.id"
          :model-value="item.id"
          :item="item"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          @reject="removeItem(item.id)"
          @resolve="updateItem(item.id)"
          @update:attributes="updateAttributes"
          @update:options="updateOptions"
          @update:provisioning="updateProvisioning"
          @update:quantity="updateQuantity"
          @update:term="updateTerm"
        />
        <footer :class="styles.basket.items.invalid.footer"></footer>
      </aside>

      <template v-if="!meta.isLoading && itemsConfigured?.length">
        <upm-basket-item
          v-for="item in itemsConfigured"
          :key="item.id"
          :model-value="item.id"
          :item="item"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          @reject="removeItem(item.id)"
          @resolve="updateItem(item.id)"
          @update:attributes="updateAttributes"
          @update:options="updateOptions"
          @update:provisioning="updateProvisioning"
          @update:quantity="updateQuantity"
          @update:term="updateTerm"
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
import UpmBasketItem from "./ItemCard.vue";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBaskeItemListings",
  components: { UpmBasketItem },
  props: {},
  setup() {
    const {
      meta,
      items,
      itemsPending,
      itemsConfigured,
      removeItem,
      updateAttributes,
      updateItem,
      updateOptions,
      updateProvisioning,
      updateQuantity,
      updateTerm,
    } = useBasket();

    const styles = useStyles(
      ["basket.items", "basket.items.invalid"],
      meta,
      config
    );

    // ---

    return {
      meta,
      items,
      itemsPending,
      itemsConfigured,
      removeItem,
      updateAttributes,
      updateItem,
      updateOptions,
      updateProvisioning,
      updateQuantity,
      updateTerm,
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {},
});
</script>
.
