<template>
  <upw-dropdown
    v-if="currencies?.length > 1 || meta.isLoading"
    :label="model?.code"
    :items="currencies"
    :size="size"
    :placement="placement"
    :disabled="meta.isLoading || meta.isProcessing"
    :upwind-config="{ listboxButton: config.currency }"
    :loading="meta.isLoading || meta.isProcessing"
    :prepend-text="model?.prefix || model?.suffix"
  >
  </upw-dropdown>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";

// --- components
import { UpwDropdown } from "@upmind/upwind";

// --- internal
import { useBasketCurrency } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- utils
import { map } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmCurrency",
  components: {
    UpwDropdown,
  },
  inheritAttrs: true,
  customOptions: {},
  emits: [],
  props: {
    size: {
      type: String,
      default: "sm",
      validator: value => ["sm", "md", "lg"].includes(value),
    },
    placement: {
      type: String,
      default: "bottom-start",
    },
  },
  setup() {
    const basketCurrency = useBasketCurrency();

    const styles = useStyles(["currency"], basketCurrency.meta, config);

    return {
      ...basketCurrency,
      styles,
      config,
      currencies: computed(() => {
        return map(basketCurrency.currencies.value, currency => ({
          prependText: currency?.prefix || currency?.suffix,
          label: currency.code,
          value: currency.code,
          selected: currency.code === basketCurrency.model.value.code,

          action: () => basketCurrency.update(currency),
        }));
      }),
    };
  },
});
</script>
