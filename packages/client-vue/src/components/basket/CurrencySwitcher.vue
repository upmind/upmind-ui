<template>
  <upw-dropdown
    v-if="currencies?.length > 1 || meta.isLoading"
    v-bind="selected"
    :items="currencies"
    :size="size"
    :placement="placement"
    :disabled="meta.isLoading || meta.isProcessing"
    :upwind-config="{ listboxButton: config.currencySwitcher }"
    :loading="meta.isLoading || meta.isProcessing"
  >
  </upw-dropdown>
</template>

<script>
// --- external
import { defineComponent, computed, watchEffect } from "vue";

// --- components
import { UpwDropdown } from "@upmind/upwind";

// --- internal
import { useBasketCurrency } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";
import currencyIcons from "./currencyIcons";

// --- utils
import { map } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmCurrencySwitcher",
  components: {
    UpwDropdown,
  },

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
    const {
      state,
      meta,
      model,
      schema,
      uischema,
      currencies,
      clear,
      input,
      update,
    } = useBasketCurrency();

    const styles = useStyles(["currencySwitcher"], meta, config);

    return {
      state,
      meta,
      model,
      schema,
      uischema,
      clear,
      input,
      update,
      //---
      styles,
      config,
      selected: computed(() => {
        if (meta.value?.isLoading) return {};
        const code = model.value.code;

        return {
          label: code,
          prependAvatar: {
            name: currencyIcons[code.toLowerCase()],
            path: "flags",
          },
        };
      }),

      currencies: computed(() => {
        return map(currencies.value, currency => ({
          // prependText: currency?.prefix || currency?.suffix,
          prependAvatar: {
            name: currencyIcons[currency?.code.toLowerCase()],
            path: "flags",
          },
          label: currency.code,
          value: currency.code,
          selected: currency.code === model.value.code,
          action: () => update(currency),
        }));
      }),
    };
  },
});
</script>
