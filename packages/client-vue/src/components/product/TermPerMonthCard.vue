<template>
  <div :class="styles.product.config.grid.item.root">
    <div :class="styles.product.config.grid.item.header">
      <span :class="styles.product.config.grid.item.title">
        {{ t(`product.terms.${props.cycle}`, props.name) }}
      </span>

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

      <span :class="styles.product.config.grid.item.text">{{
        props.meta.free ? t("product.free") : props.currentPrice
      }}</span>
    </div>

    <div :class="styles.product.config.grid.item.footer">
      <span
        :class="styles.product.config.grid.item.discount"
        v-if="props.meta.discounted"
        >{{
          t("product.cycle", {
            value: props.monthlyFromRegularPrice,
          })
        }}</span
      >
      <strong :class="styles.product.config.grid.item.total">{{
        t("product.cycle", {
          value: props.monthlyFromCurrentPrice,
        })
      }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upwind";
import config from "./config.cva";

// --- components
import { Badge } from "@upmind-automation/upwind";

// --- utils

// --- types

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

const { t } = useI18n();

const meta = computed(() => ({
  hasPromotions: !!props.promotions?.length || props.mixedPromotions,
}));

const styles = useStyles(
  ["product.config.grid", "product.config.grid.item"],
  meta,
  config
);
</script>
