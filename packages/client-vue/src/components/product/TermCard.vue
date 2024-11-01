<template>
  <div :class="styles.product.config.grid.item.root">
    <div :class="styles.product.config.grid.item.header">
      <span :class="styles.product.config.grid.item.title">
        {{ props.billing_cycle_name }}
      </span>

      <template v-for="promotion in props.promotions" :key="promotion.id">
        <Badge color="promotion" variant="tonal" size="xs">
          {{
            promotion.mixed || !promotion.amount
              ? t("product.promotion")
              : t("product.promotion_save", {
                  value: promotion.amount_formatted,
                })
          }}
        </Badge>
      </template>

      <span
        :class="styles.product.config.grid.item.text"
        v-if="props.monthly_price_from && props.billing_cycle_months > 1"
      >
        {{
          t("product.cycle", {
            value: props.monthly_price_from_discounted
              ? props.monthly_price_from_discounted_formatted
              : props.monthly_price_from_formatted,
          })
        }}
      </span>
    </div>

    <div :class="styles.product.config.grid.item.footer">
      <span
        :class="styles.product.config.grid.item.discount"
        v-if="!isNil(props.price_discounted)"
      >
        {{ props.price_formatted }}
      </span>
      <strong :class="styles.product.config.grid.item.total">
        {{
          !isNil(props.price_discounted)
            ? props.price_discounted_formatted
            : props.price
              ? props.price_formatted
              : t("product.free")
        }}
      </strong>
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
import { isNil } from "lodash";

// --- types

// -----------------------------------------------------------------------------

const props = defineProps<{
  billing_cycle_months: number;
  billing_cycle_name: string;
  price: number;
  // ---
  mixed_promotions?: boolean;
  monthly_price_from_discounted?: number;
  monthly_price_from_discounted_formatted?: string;
  monthly_price_from?: number;
  monthly_price_from_formatted?: string;
  price_discounted?: number;
  price_discounted_formatted?: string;
  price_formatted?: string;
  promotions?: {
    name?: string;
    amount?: number;
    amount_formatted?: string;
    code: string[];
    display?: string;
    mixed?: boolean;
  }[];
}>();

// ---

const { t } = useI18n();

const meta = computed(() => ({
  hasPromotions: !!props.promotions?.length || props.mixed_promotions,
}));

const styles = useStyles(
  ["product.config.grid", "product.config.grid.item"],
  meta,
  config
);
</script>
