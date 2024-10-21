<template>
  <Combobox
    v-if="currencies?.length > 1 || meta.isLoading"
    :model-value="selected"
    :items="currencies"
    :size="size"
    :placement="placement"
    :disabled="meta.isLoading || meta.isProcessing"
    :upwind-config="{ listboxButton: config.currencySwitcher }"
    :loading="meta.isLoading || meta.isProcessing"
  />
</template>

<script>
// --- external
import { defineComponent, computed } from "vue";

// --- custom elements
import { Combobox } from "@upmind/upwind";

// --- internal
import { useBasketCurrency } from "@upmind/headless-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";
import currencyMap from "./currencies";

// --- utils
import { map } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmCurrencySwitcher",
  components: {
    Combobox,
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
          icon: currencyMap[code?.toUpperCase()]?.country_code?.toLowerCase(),
        };
      }),

      currencies: computed(() => {
        return map(currencies.value, currency => ({
          // prependText: currency?.prefix || currency?.suffix,
          prependAvatar: {
            name: currencyMap[
              currency?.code?.toUpperCase()
            ]?.country_code?.toLowerCase(),
            path: "flags",
          },
          icon: currencyMap[
            currency?.code?.toUpperCase()
          ]?.country_code?.toLowerCase(),
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
