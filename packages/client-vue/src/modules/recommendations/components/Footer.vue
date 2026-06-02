<template>
  <div :class="styles.recommendation.footer.root">
    <p v-if="count" :class="styles.recommendation.footer.label">
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
      :label="t('action.skip')"
      color="primary"
      size="lg"
      :class="styles.recommendation.footer.button"
      iconAppend="arrow-right"
      :loading="isNavigating"
    />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useConfig,
  useMoney,
  useRoutingEngine
} from "@upmind-automation/headless";
import config from "../recommendations.config";

// --- components
import { Button, useStyles } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

defineEmits<{
  skip: [];
}>();

const { t } = useI18n();
const { count, summary, meta: basketMeta } = useBasket();
const { formatPrice } = useMoney();
const { ui, data } = useConfig();
const { isNavigating } = useRoutingEngine();

const styles = useStyles(["recommendation.footer"], {}, config);
</script>
