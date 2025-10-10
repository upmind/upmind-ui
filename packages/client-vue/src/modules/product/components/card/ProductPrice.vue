<template>
  <section :class="styles.product.header.price.root">
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

      <Badge variant="outline" color="promotion" size="sm">
        {{
          t("action.save_value", {
            value: price?.savingPercent
          })
        }}
      </Badge>
    </header>

    <p :class="styles.product.header.price.currentPrice.root">
      <strong
        v-if="meta?.free"
        :class="styles.product.header.price.currentPrice.amount"
      >
        {{ t("text.free") }}
      </strong>

      <template v-else>
        <strong :class="styles.product.header.price.currentPrice.amount">{{
          currentPrice
        }}</strong>

        <small
          :class="styles.product.header.price.currentPrice.term"
          v-if="has(props, 'cycle')"
          >/
          {{
            meta.useMonthlyFromPrice
              ? t("term.n_months", 1)
              : parseBillingCycle(props.cycle!).descriptive
          }}
        </small>
      </template>
    </p>

    <footer
      v-if="
        !hideTermSummary &&
        !meta.oneoff &&
        meta.useMonthlyFromPrice &&
        has(props, 'cycle')
      "
      :class="styles.product.header.price.total"
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
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";
import config from "./card.config";

// --- utils
import { has } from "lodash-es";

// --- components
import { useStyles } from "@upmind-automation/upmind-ui";
import { Badge } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { ProductPrice } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<Omit<ProductPrice, "name">>();

const { t } = useI18n();

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
) as ComputedRef<{
  product: {
    header: {
      price: {
        root: string;
        regularPrice: string;
        currentPrice: {
          root: string;
          amount: string;
          term: string;
        };
        total: string;
      };
    };
  };
}>;

const regularPrice = computed(() => {
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
