<template>
  <Combobox
    v-if="currencies?.length > 1 || meta.isLoading"
    class="w-dropdown-xs md:w-dropdown-2xs bg-base text-primary"
    :popoverClass="['w-dropdown-xs md:w-dropdown-2xs', popoverClass]"
    :modelValue="selected?.value"
    :items="currencies"
    :loading="meta.isLoading"
    @update:modelValue="updateCurrency"
    search
  />
</template>

<script>
// --- external
import { defineComponent, computed } from "vue";

// --- internal
import { useBasketCurrency } from "@upmind-automation/headless-vue";
import rawCurrencies from "./currencies";

// --- components
import { Combobox } from "@upmind-automation/upmind-ui";

// --- utils
import { map } from "lodash-es";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "VCurrencySwitcher",
  components: { Combobox },

  props: {
    popoverClass: { type: String, default: "mt-0" },
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

    function updateCurrency(value) {
      update({ code: value });
    }

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
            icon: rawCurrencies[
              code?.toUpperCase()
            ]?.country_code?.toLowerCase(),
          },
        };
      }),

      currencies: computed(() => {
        return map(currencies.value, currency => ({
          avatar: {
            icon: rawCurrencies[
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
