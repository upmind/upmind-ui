<template>
  <section
    :class="styles.product.header.price.root"
    data-test-key="product-card-price-display"
  >
    <template v-if="!hidePrice">
      <header
        v-if="meta?.discounted"
        :class="styles.product.header.price.regularPrice"
      >
        <del>
          {{
            t("text.price_was", {
              price:
                meta?.oneoff || !meta?.useMonthlyFromPrice
                  ? price?.regularPrice
                  : price?.monthlyFromRegularPrice
            })
          }}
        </del>

        <Badge
          variant="minimal"
          color="promo"
          size="sm"
          :dataAttrs="{
            'data-test-key': 'promo-badge',
            'data-test-value': price?.savingPercent ?? ''
          }"
        >
          {{
            t("action.save_value", {
              value: price?.savingPercent
            })
          }}
        </Badge>
      </header>

      <header
        v-else-if="meta?.custom"
        :class="styles.product.header.price.regularPrice"
      >
        <del>
          {{
            t("text.price_was", {
              price:
                meta?.oneoff || !meta?.useMonthlyFromPrice
                  ? price?.regularPrice
                  : price?.monthlyFromRegularPrice
            })
          }}
        </del>

        <Tooltip :label="t('text.price_manually_adjusted_msg')">
          <Badge variant="minimal" color="warning" size="sm">
            {{ t("text.custom_price") }}
          </Badge>
        </Tooltip>
      </header>

      <p :class="styles.product.header.price.currentPrice.root">
        <strong
          :class="styles.product.header.price.currentPrice.amount"
          data-test-key="product-card-price"
          >{{
            formatPrice(currentPrice, {
              zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
              trimTrailingZeroes: data.trimTrailingZeroes
            })
          }}</strong
        >

        <small
          :class="styles.product.header.price.currentPrice.term"
          v-if="has(props, 'cycle') && props.cycle! > 0"
          data-test-key="product-card-price-cycle"
          >/
          {{
            meta.useMonthlyFromPrice
              ? t("term.n_months", 1)
              : parseBillingCycle(props.cycle!).descriptive
          }}
        </small>
      </p>
    </template>

    <footer
      v-if="
        !hideTermSummary &&
        !meta.oneoff &&
        meta.useMonthlyFromPrice &&
        has(props, 'cycle')
      "
      :class="styles.product.header.price.total"
      data-test-key="product-card-footer"
    >
      {{
        t("term.summary_msg", {
          term: parseBillingCycle(props.cycle!).numeric,
          price: price?.currentPrice
        })
      }}
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  parseBillingCycle,
  useMoney,
  useConfig
} from "@upmind-automation/headless";
import { useStyles, Badge, Tooltip } from "@upmind-automation/upmind-ui";
import config from "./card.config";
import { has } from "lodash-es";
import type { ProductPriceProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ProductPriceProps>(), {
  hidePrice: false,
  hideTermSummary: false
});

const { t } = useI18n();
const { ui, data } = useConfig();
const { formatPrice } = useMoney();

const configMeta = computed(() => ({
  //
}));

const styles = useStyles(
  [
    "product.header",
    "product.header.price",
    "product.header.price.currentPrice"
  ],
  configMeta,
  config
);

const _regularPrice = computed(() => {
  if (props.meta?.useMonthlyFromPrice)
    return props.price?.monthlyFromRegularPrice;

  return props.price?.regularPrice;
});

const currentPrice = computed(() => {
  if (props.meta?.useMonthlyFromPrice)
    return props.price?.monthlyFromCurrentPrice;

  return props.price?.currentPrice;
});
</script>
