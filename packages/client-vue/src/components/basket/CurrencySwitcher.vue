<template>
  <Combobox
    v-if="currencies?.length > 1 || meta.isLoading"
    class="w-dropdown-xs md:w-dropdown-2xs bg-base text-primary"
    popoverClass="w-dropdown-xs md:w-dropdown-2xs"
    :modelValue="selected"
    :items="currencies"
    :loading="meta.isLoading"
    @update:modelValue="updateCurrency"
  />
</template>

<script>
// --- external
import { defineComponent, computed } from "vue";

// --- internal
import { useBasketCurrency } from "@upmind/headless-vue";
import currencyMap from "./currencies";

// --- components
import { Combobox } from "@upmind/upwind";

// --- utils
import { map } from "lodash-es";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "VCurrencySwitcher",
  components: { Combobox },
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

    const updateCurrency = currency => {
      update({ code: currency.value });
    };

    return {
      state,
      meta,
      model,
      schema,
      uischema,
      clear,
      input,
      updateCurrency,
      //---
      selected: computed(() => {
        if (meta.value?.isLoading) return undefined;
        const code = model.value.code;

        return {
          label: code,
          value: code,
          avatar: {
            icon: currencyMap[code?.toUpperCase()]?.country_code?.toLowerCase(),
          },
        };
      }),

      currencies: computed(() => {
        return map(currencies.value, currency => ({
          avatar: {
            icon: currencyMap[
              currency?.code?.toUpperCase()
            ]?.country_code?.toLowerCase(),
          },
          label: currency.code,
          value: currency.code,
          selected: currency.code === model.value.code,
        }));
      }),
    };
  },
});
</script>
