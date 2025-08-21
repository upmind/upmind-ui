<template>
  <p>
    <template v-if="meta?.oneoff">
      {{
        t(`product.terms.price.0`, [
          productDetails?.displayPrice?.price.monthlyFromCurrentPrice
        ])
      }}
    </template>
    <template v-else>
      {{
        t(`product.terms.price.1`, [
          productDetails?.displayPrice?.price.monthlyFromCurrentPrice
        ])
      }}
      <del v-if="meta?.discounted" class="text-emphasis-medium">
        {{
          t("product.was", [
            productDetails?.displayPrice?.price.monthlyFromRegularPrice
          ])
        }}
      </del>
    </template>
  </p>
</template>

<script setup lang="ts">
import type {
  Price,
  ProductDetails,
  ProductSummaryMeta
} from "@upmind-automation/headless";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{
  productDetails: ProductDetails;
  meta?: ProductSummaryMeta;
}>();
</script>
