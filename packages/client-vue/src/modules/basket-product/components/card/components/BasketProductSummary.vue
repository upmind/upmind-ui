<template>
  <div :class="productOptionDetailsVariants()">
    <h5 :class="productSummaryCategoryTextVariants()">
      {{ summary.category }}
    </h5>

    <div :class="productOptionTitleVariants()">
      <strong :class="productSummaryTitleTextVariants()">
        {{ summary.title }}
      </strong>

      <Promotion
        v-if="!isMobile"
        v-for="(promotion, index) in summary.promotions"
        :key="index"
        v-bind="promotion"
      />
    </div>

    <p
      v-if="!summary.meta?.free"
      :class="
        productOptionDescriptionVariants({
          selected: meta.selected,
          quantifiable: meta.quantifiable
        })
      "
    >
      <slot />
      <!-- e.g. "Usually $14.99" (struck through) -->
      <span
        v-if="summary.meta?.discounted"
        :class="productOptionDiscountedVariants()"
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
import { isMobile } from "../../../../../composables/isMobile";
import {
  productOptionDetailsVariants,
  productOptionTitleVariants,
  productOptionDescriptionVariants,
  productOptionDiscountedVariants,
  productSummaryCategoryTextVariants,
  productSummaryTitleTextVariants
} from "../basketProduct.variants";
import Promotion from "./Promotion.vue";
import type { BasketProductSummaryProps } from "../types";
// -----------------------------------------------------------------------------

const props = defineProps<BasketProductSummaryProps>();

const { t } = useI18n();

const meta = computed(() => ({
  selected: !!props.summary.toggle?.selected,
  quantifiable: !!props.summary.meta?.quantifiable
}));
</script>
