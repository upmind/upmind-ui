<template>
  <template v-for="(item, index) in pricing" :key="`pricing-${index}`">
    <div :class="styles.summary.pricing.price">
      <dt :class="styles.summary.pricing.total">
        {{ t("text.total") }}
      </dt>

      <CurrentPrice
        is="dd"
        :current-price="item.price.currentPrice"
        :monthly-from-current-price="item.price.monthlyFromCurrentPrice ?? ''"
        :free="item.meta.free ?? false"
        data-test-key="total-price"
        :ui-config="{
          pricing: {
            current: [styles.summary.pricing.currentPrice]
          }
        }"
      />
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";
import CurrentPrice from "../pricing/CurrentPrice.vue";
import config from "./pricing.config";
import type { ProductSummaryDetailWithPrice } from "@upmind-automation/headless";

const props = defineProps<{
  pricing: ProductSummaryDetailWithPrice[];
  footer?: boolean;
}>();

const { t } = useI18n();

const stylesMeta = computed(() => ({
  footer: props.footer
}));

const styles = useStyles(["summary.pricing"], stylesMeta, config);
</script>
