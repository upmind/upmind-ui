<template>
  <upw-dropdown
    v-if="currencies?.length > 1 || meta.isLoading"
    :items="currencies"
    :size="size"
    :placement="placement"
    :disabled="meta.isLoading || meta.isProcessing"
    :upwind-config="{ listboxButton: config.currency }"
    :loading="meta.isLoading || meta.isProcessing"
    :label="model?.code"
    :avatar="{
      // name: (model?.code || model?.prefix || model?.suffix)?.toLowerCase(),
      // path: 'currencies',
      caption: model?.prefix || model?.suffix,
    }"
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
import type { PropType } from "vue";

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
      type: String as PropType<DropdownProps["position"]>,
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
          label: currency.code,
          avatar: {
            // name: (currency.code || currency.prefix || currency.suffix)?.toLowerCase(),
            // path: "currencies",
            caption: currency.prefix || currency.suffix,
          },
          action: () => basketCurrency.update(currency),
        }));
      }),
    };
  },
});
</script>
