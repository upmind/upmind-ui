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
        v-bind="props"
        :class="styles.product.config.grid.item.text"
      />
    </div>

    <div :class="styles.product.config.grid.item.footer">
      <Pricing
        v-bind="props"
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
import type { Term } from "@upmind-automation/headless-vue";

// -----------------------------------------------------------------------------

const props = defineProps<
  Term & {
    select?: boolean;
  }
>();

// ---

const { t, te } = useI18n();

const meta = computed(() => ({
  hasPromotions: !isEmpty(props.promotions) || props.meta?.mixed,
  select: props.select,
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
