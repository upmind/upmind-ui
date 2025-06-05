<template>
  <div :class="styles.product.config.grid.item.root">
    <div :class="styles.product.config.grid.item.header">
      <strong :class="styles.product.config.grid.item.title">
        {{
          te(`product.terms.cycle.${props.cycle}`)
            ? t(`product.terms.cycle.${props.cycle}`)
            : props.title
        }}
      </strong>

      <Promotion
        v-for="promotion in props.promotions"
        :key="promotion.code.toString()"
        v-bind="promotion"
      />

      <CurrentPrice
        :current-price="props.price.currentPrice"
        :monthly-from-current-price="props.price.monthlyFromCurrentPrice"
        :meta="props.meta"
        :cycle="props.cycle"
        :class="styles.product.config.grid.item.text"
      />
    </div>

    <div :class="styles.product.config.grid.item.footer" class="pricing">
      <Pricing
        class="pricing"
        :regular-price="props.price.regularPrice"
        :monthly-from-regular-price="props.price.monthlyFromRegularPrice"
        :current-price="props.price.currentPrice"
        :monthly-from-current-price="props.price.monthlyFromCurrentPrice"
        :meta="props.meta"
        :cycle="props.cycle"
        :ui-config="{
          pricing: {
            current: styles.product.config.grid.item.total,
          },
        }"
        show-cycle
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../../product.config";

// --- components
import CurrentPrice from "../pricing/CurrentPrice.vue";
import Pricing from "../pricing/Pricing.vue";
import Promotion from "../../../basket/product/components/Promotion.vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { TermDetails } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<
  TermDetails & {
    select?: boolean;
  }
>();

// ---

const { t, te } = useI18n();

const meta = computed(() => ({
  hasPromotions: !isEmpty(props.promotions) || props.meta?.mixed,
  isSelected: props.select,
}));

const styles = useStyles(
  ["product.config.grid", "product.config.grid.item"],
  meta,
  config
) as ComputedRef<{
  product: {
    config: {
      grid: {
        item: {
          root: string;
          header: string;
          title: string;
          text: string;
          footer: string;
          total: string;
        };
      };
    };
  };
}>;
</script>
