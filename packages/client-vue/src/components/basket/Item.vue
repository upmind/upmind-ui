<template>
  <upm-product-config
    v-if="open"
    v-bind="$props"
    @reject="open = false"
    @resolve="updateItem(modelValue)"
    @update:attributes="updateAttributes"
    @update:options="updateOptions"
    @update:provisioning="updateProvisioning"
    @update:quantity="updateQuantity"
    @update:term="updateTerm"
  />
  <upm-product-card
    v-else
    v-bind="$props"
    @reject="removeItem(modelValue)"
    @resolve="open = true"
  />
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmProductCard from "../product/Card.vue";
import UpmProductConfig from "../product/Config.vue";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketItem",
  components: { UpmProductCard, UpmProductConfig },
  emits: ["reject", "resolve"],
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    item: {
      type: Object, // xstate actor
      required: true,
    },
  },
  setup(props, { emit }) {
    const {
      meta,
      removeItem,
      updateItem,
      updateAttributes,
      updateOptions,
      updateProvisioning,
      updateQuantity,
      updateTerm,
    } = useBasket();

    const styles = useStyles(
      ["basket.item", "basket.item.details"],
      meta,
      config
    );

    // ---

    return {
      meta,
      removeItem,
      updateItem,
      updateAttributes,
      updateOptions,
      updateProvisioning,
      updateQuantity,
      updateTerm,
      // ---
      open: ref(false),
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {},
});
</script>
.
