<template>
  <div :class="styles.product.config.grid.item.root">
    <div :class="styles.product.config.grid.item.header">
      <strong :class="styles.product.config.grid.item.title">
        {{
          te(`product.terms.cycle.${props.cycle}`)
            ? t(`product.terms.cycle.${props.cycle}`)
            : props.name
        }}
      </strong>

      <template v-for="promotion in props.promotions" :key="promotion.id">
        <Badge color="promotion" variant="tonal" size="sm">
          {{
            promotion.mixed || !promotion.amount
              ? t("product.promotion")
              : t("product.promotion_save", {
                  value: promotion.amountFormatted,
                })
          }}
        </Badge>
      </template>

      <span
        :class="styles.product.config.grid.item.text"
        v-if="props.monthlyFromCurrentAmount && props.cycle > 1"
      >
        {{
          t("product.cycle", {
            value: props.monthlyFromCurrentPrice,
          })
        }}
      </span>
    </div>

    <div :class="styles.product.config.grid.item.footer">
      <Pricing
        v-bind="props"
        :ui-config="{
          pricing: {
            current: styles.product.config.grid.item.total,
          },
        }"
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
import config from "./config.cva";

// --- components
import { Badge } from "@upmind-automation/upmind-ui";
import Pricing from "../pricing/Pricing.vue";

// --- utils

// --- types
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------

const props = defineProps<{
  name: string;
  price: number;
  cycle: number;
  // ---
  mixedPromotions?: boolean;
  monthlyFromCurrentAmount?: number;
  monthlyFromCurrentPrice?: string;
  monthlyFromRegularAmount?: number;
  monthlyFromRegularPrice?: string;
  regularAmount?: number;
  regularPrice?: string;
  currentPrice?: string;
  currentAmount?: number;
  meta: {
    discounted?: boolean;
    free?: boolean;
  };
  promotions?: {
    name?: string;
    amount?: number;
    amountFormatted?: string;
    code: string[];
    display?: string;
    mixed?: boolean;
  }[];
}>();

// ---

const { t, te } = useI18n();

const meta = computed(() => ({
  hasPromotions: !!props.promotions?.length || props.mixedPromotions,
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
