<template>
  <div :class="footerRootVariants()">
    <p v-if="count" :class="footerLabelVariants()">
      {{
        basketMeta.isFree
          ? t("cart.basket_summary_desc_free", { count })
          : t("cart.basket_summary_taxes_desc", {
              count,
              total:
                formatPrice(summary?.total, {
                  zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
                  trimTrailingZeroes: data.trimTrailingZeroes
                }) ?? 0,
              tax: basketMeta.hasTaxIncluded
                ? t("cart.basket_tax_incl")
                : t("cart.basket_tax_excl")
            })
      }}
    </p>

    <Button
      @click="$emit('skip')"
      variant="primary"
      size="lg"
      :class="footerButtonVariants()"
      :loading="isNavigating"
    >
      {{ t("action.skip") }}
      <Icon icon="arrow-right" />
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { Button } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import {
  useBasket,
  useConfig,
  useMoney,
  useRoutingEngine
} from "@upmind-automation/headless";
import { Icon } from "../../../components/icon";
import {
  footerRootVariants,
  footerLabelVariants,
  footerButtonVariants
} from "../variants";

// --- components
// -----------------------------------------------------------------------------

defineEmits<{
  skip: [];
}>();

const { t } = useI18n();
const { count, summary, meta: basketMeta } = useBasket();
const { formatPrice } = useMoney();
const { ui, data } = useConfig();
const { isNavigating } = useRoutingEngine();
</script>
