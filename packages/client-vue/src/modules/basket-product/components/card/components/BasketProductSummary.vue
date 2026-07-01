<template>
  <div :class="styles.product.option.details">
    <h5 :class="styles.product.summary.category.text">
      {{ summary.category }}
    </h5>

    <div :class="styles.product.option.title">
      <strong :class="styles.product.summary.title.text">
        {{ summary.title }}
      </strong>

      <Promotion
        v-if="!isMobile"
        v-for="(promotion, index) in summary.promotions"
        :key="index"
        v-bind="promotion"
      />
    </div>

    <p v-if="!summary.meta?.free" :class="styles.product.option.description">
      <slot />
      <!-- e.g. "Usually $14.99" (struck through) -->
      <span
        v-if="summary.meta?.discounted"
        :class="styles.product.option.discounted"
      >
        {{
          t("term.renews_usually_msg", { price: summary.price.regularPrice })
        }}
      </span>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useStyles, isMobile } from "@upmind-automation/upmind-ui";
import config from "../basketProduct.config";
import Promotion from "./Promotion.vue";
import type { BasketProductSummaryProps } from "../types";
// -----------------------------------------------------------------------------

const props = defineProps<BasketProductSummaryProps>();

const { t } = useI18n();

const meta = computed(() => ({
  selected: !!props.summary.toggle?.selected,
  quantifiable: !!props.summary.meta?.quantifiable
}));

const styles = useStyles(
  ["product.summary.category", "product.summary.title", "product.option"],
  meta,
  config
);
</script>
