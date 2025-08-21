<template>
  <header
    v-if="meta?.discounted"
    :class="styles.product.header.price.regularPrice"
  >
    <s>Was {{ price?.regularPrice }}</s>
    <Badge variant="outline" color="promotion" size="sm">
      {{ t("product.promotionSave", [price?.savingPercent]) }}
    </Badge>
  </header>
  <p :class="styles.product.header.price.currentPrice.root">
    <strong
      v-if="meta?.free"
      :class="styles.product.header.price.currentPrice.amount"
    >
      {{ t("product.free") }}
    </strong>
    <template v-else>
      <strong :class="styles.product.header.price.currentPrice.amount">{{
        price?.currentPrice
      }}</strong>
      <small :class="styles.product.header.price.currentPrice.term"
        >/ {{ t(`product.terms.term.${productDetails.cycle}`) }}</small
      >
    </template>
  </p>
  <footer v-if="!hideAnnualTerm" :class="styles.product.header.price.total">
    <template
      v-if="annualTerm && te(`product.terms.summary.${annualTerm?.cycle}`)"
    >
      {{
        t(`product.terms.summary.${annualTerm?.cycle}`, [
          annualTerm?.price.currentPrice
        ])
      }}
    </template>
  </footer>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import config from "./product.config";

// --- utils
import { first } from "lodash-es";

// --- components
import { useStyles } from "@upmind-automation/upmind-ui";
import { Badge } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { ProductPrice } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<ProductPrice>();

const { t, te } = useI18n();

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

const annualTerm = computed(() => {
  return first(props.pricing?.filter(p => p.cycle && p.cycle % 12 === 0));
});
</script>
