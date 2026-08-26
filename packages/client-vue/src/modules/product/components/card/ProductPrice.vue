<template>
  <section
    :class="cardHeaderPriceRootVariants()"
    data-test-key="product-card-price-display"
  >
    <template v-if="!hidePrice">
      <header
        v-if="meta?.discounted"
        :class="cardHeaderPriceRegularPriceVariants()"
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
          appearance="outline"
          variant="promo"
          size="sm"
          data-test-key="promo-badge"
          :data-test-value="price?.savingPercent ?? ''"
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
        :class="cardHeaderPriceRegularPriceVariants()"
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

        <Tooltip>
          <Badge appearance="outline" variant="warning" size="sm">
            {{ t("text.custom_price") }}
          </Badge>
          <template #content>{{
            t("text.price_manually_adjusted_msg")
          }}</template>
        </Tooltip>
      </header>

      <p :class="cardHeaderPriceCurrentPriceRootVariants()">
        <strong
          :class="cardHeaderPriceCurrentPriceAmountVariants()"
          data-test-key="product-card-price"
          >{{
            formatPrice(currentPrice, {
              zeroPriceDisplayIsLabel: ui.zeroPriceDisplay.isLabel,
              trimTrailingZeroes: data.trimTrailingZeroes
            })
          }}</strong
        >

        <small
          :class="cardHeaderPriceCurrentPriceTermVariants()"
          v-if="has(props, 'cycle') && props.cycle! > 0"
          v-bind="priceCycleTestAttrs"
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
      :class="cardHeaderPriceTotalVariants()"
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
import { useTestAttrs } from "@upmind/ui";
import { Badge, Tooltip } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  parseBillingCycle,
  useMoney,
  useConfig
} from "@upmind-automation/headless";
import {
  cardHeaderPriceRootVariants,
  cardHeaderPriceRegularPriceVariants,
  cardHeaderPriceCurrentPriceRootVariants,
  cardHeaderPriceCurrentPriceAmountVariants,
  cardHeaderPriceCurrentPriceTermVariants,
  cardHeaderPriceTotalVariants
} from "./variants";
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

const priceCycleTestAttrs = useTestAttrs({ key: "product-card-price-cycle" });
</script>
