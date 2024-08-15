<template>
  <upm-product-config
    v-if="open"
    v-bind="$props"
    :class="'styles.basket.item'"
    :processing="meta.isProcessing"
    :required="meta.isRequired"
    @reject="open = false"
    @resolve="doResolve"
    @update:attributes="updateAttributes"
    @update:options="updateOptions"
    @update:provisioning="updateProvisioning"
    @update:quantity="updateQuantity"
    @update:term="updateTerm"
  >
    <template #header>
      <span v-if="meta.isNew">{{ $t("basket.items.pending.title") }}</span>
      <span v-else-if="meta.hasErrors">{{
        $t("basket.items.invalid.title")
      }}</span>
    </template>
  </upm-product-config>
  <upm-product-card
    v-else
    v-bind="$props"
    :class="'styles.basket.item'"
    @reject="removeItem"
    @resolve="open = true"
  >
    <template #badges v-if="!meta.isLoading">
      <upw-badge
        v-if="meta.isNew"
        color="accent"
        variant="flat"
        :class="styles.basket.item.ping.root"
      >
        {{ $t("basket.items.pending.badge") }}
      </upw-badge>
      <upw-badge
        v-else-if="meta.hasErrors"
        color="error"
        variant="flat"
        :class="styles.basket.item.ping.root"
      >
        {{ $t("basket.items.invalid.badge") }}
      </upw-badge>
    </template>
  </upm-product-card>
</template>

<script>
// --- external
import { computed, defineComponent, ref } from "vue";

// --- internal
import { useBasket, utils } from "@upmind/flow-vue";
const { stateMatches, contextMatches, machineMatches } = utils;
import { useStyles, mergeStyles, UpwBadge } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmProductCard from "../product/Card.vue";
import UpmProductConfig from "../product/Config.vue";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketItem",
  components: { UpmProductCard, UpmProductConfig, UpwBadge },
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
    selected: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const {
      meta,
      items,
      removeItem,
      updateItem,
      updateAttributes,
      updateOptions,
      updateProvisioning,
      updateQuantity,
      updateTerm,
    } = useBasket();

    const itemMeta = computed(() => ({
      isRequired: items.value.length <= 1,
      isLoading: meta.value.isLoading,
      isProcessing: meta.value.isProcessing,
      isNew: !contextMatches(props.item, ["basket_product"]),
      hasErrors:
        contextMatches(props.item, ["basket_product"]) &&
        machineMatches(props.item, ["available.error"]),
    }));

    const styles = useStyles(
      ["basket.item", "basket.item.ping"],
      itemMeta,
      config
    );
    // ---

    const open = ref(props.selected);

    // ---

    return {
      meta: itemMeta,
      removeItem,
      updateItem,
      updateAttributes,
      updateOptions,
      updateProvisioning,
      updateQuantity,
      updateTerm,
      // ---
      open,
      // ---
      styles,
      mergeStyles,
    };
  },
  computed: {},
  methods: {
    async doResolve() {
      this.updateItem(this.modelValue).then(item => {
        this.open = !stateMatches(item.state, [
          "available.complete",
          "complete",
        ]);
      });
    },
  },
});
</script>
.
