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
        !isNil(props.priceDiscounted)
          ? props.priceDiscountedFormatted
          : props.price
            ? props.priceFormatted
            : t("product.free")
      }}</span>
    </div>

    <div :class="styles.product.config.grid.item.footer">
      <span
        :class="styles.product.config.grid.item.discount"
        v-if="!isNil(props.monthlyPriceFromDiscounted)"
        >{{
          t("product.cycle", {
            value: props.monthlyPriceFromFormatted,
          })
        }}</span
      >
      <strong :class="styles.product.config.grid.item.total">{{
        t("product.cycle", {
          value: !isNil(props.monthlyPriceFromDiscounted)
            ? props.monthlyPriceFromDiscountedFormatted
            : props.monthlyPriceFromFormatted,
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
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { Icon, Tooltip, Badge } from "@upmind/upwind";

// --- utils
import { isNil } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------

const props = defineProps<{
  name: string;
  price: number;
  cycle: number;
  // ---
  mixedPromotions?: boolean;
  monthlyPriceFromDiscounted?: number;
  monthlyPriceFromDiscountedFormatted?: string;
  monthlyPriceFrom?: number;
  monthlyPriceFromFormatted?: string;
  priceDiscounted?: number;
  priceDiscountedFormatted?: string;
  priceFormatted?: string;
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
