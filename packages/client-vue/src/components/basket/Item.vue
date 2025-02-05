<template>
  <ProductConfig
    v-if="open || selected"
    v-bind="$props"
    :class="styles.basket.item"
    :processing="meta.isProcessing"
    :required="selected"
    @reject="open = false"
    @resolve="doResolve"
    @update:attributes="updateAttributes"
    @update:options="updateOptions"
    @update:provisioning="updateProvisioning"
    @update:quantity="updateQuantity"
    @update:term="updateTerm"
  >
    <template #header>
      <span v-if="meta.isNew">{{ t("basket.items.pending.title") }}</span>
      <span v-else-if="meta.hasErrors">{{
        t("basket.items.invalid.title")
      }}</span>
    </template>
  </ProductConfig>
  <ProductCard
    v-else
    v-bind="$props"
    :class="styles.basket.item"
    @reject="removeItem"
    @resolve="open = true"
  >
    <template #badges v-if="!meta.isLoading">
      <Badge
        v-if="meta.isNew"
        color="accent"
        variant="flat"
        :class="styles.basket.item.ping.root"
      >
        {{ t("basket.items.pending.badge") }}
      </Badge>
      <Badge
        v-else-if="meta.hasErrors"
        color="error"
        variant="flat"
        :class="styles.basket.item.ping.root"
      >
        {{ t("basket.items.invalid.badge") }}
      </Badge>
    </template>
  </ProductCard>
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useProductConfig,
  useBasket,
  utils,
} from "@upmind-automation/headless-vue";
const { stateMatches } = utils;
import { useStyles, cn } from "@upmind-automation/upmind-ui";

import config from "./config.cva";

// --- components
import ProductCard from "../product/Card.vue";
import ProductConfig from "../product/Config.vue";

// --- custom elements
import { Badge } from "@upmind-automation/upmind-ui";

// --- types

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "BasketProduct",
  components: { Badge, ProductCard, ProductConfig },
  emits: ["reject", "resolve"],
  props: {
    modelValue: {
      type: string,
      required: true,
    },
    item: {
      type: object, // xstate actor
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const { removeItem, updateItem } = useBasket();

    const {
      meta,
      updateAttributes,
      updateOptions,
      updateProvisioning,
      updateQuantity,
      updateTerm,
    } = useProductConfig(props.item);

    const styles = useStyles(["basket.item", "basket.item.ping"], meta, config);
    // ---

    const open = ref(props.selected);

    // ---

    return {
      t,
      meta,
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
      cn,
    };
  },
  computed: {},
  methods: {
    async doResolve() {
      this.updateItem(this.modelValue).then(item => {
        this.open = !stateMatches(item.state, ["available.complete"]);
      });
    },
  },
});
</script>
.
