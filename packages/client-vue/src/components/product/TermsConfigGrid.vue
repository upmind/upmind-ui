<template>
  <FormField
    v-if="hasItems"
    id="terms"
    name="terms"
    :class="styles.product.config.grid.root"
    :label="props.label"
    :required="props.required"
    :disabled="props.disabled || props.processing"
    :visible="props.visible"
    :errors="props.errors"
    :tooltip="props.description"
    auto-focus
  >
    <RadioCards
      id="terms"
      name="terms"
      as="ul"
      :required="props.required"
      :items="parsedValues"
      :disabled="props.disabled || props.processing"
      :errors="props.errors"
      :none-text="t('product.select.none')"
      :placeholder="t('product.select.placeholder')"
      :class="styles.product.config.grid.items"
      layout="grid"
      :model-value="props.modelValue"
      @update:modelValue="doResolve"
    >
      <template #item="{ item }">
        <!-- <VCardSubproduct
        v-bind="getSubProduct(item.value)"
        :price-override="subproduct?.price_override"
      /> -->

        <div :class="styles.product.config.grid.item.header">
          <span :class="styles.product.config.grid.item.title">
            {{ item.billing_cycle_name }}
          </span>

          <template v-for="promotion in item?.promotions" :key="promotion.id">
            <Badge
              color="promotion"
              :label="
                t(
                  'product.promo_save',
                  promotion.mixed || !promotion.amount ? 1 : 0,
                  {
                    value: promotion.amount_formatted,
                  }
                )
              "
            />
          </template>

          <span
            :class="styles.product.config.grid.item.text"
            v-if="item?.monthly_price_from && item.billing_cycle_months > 1"
          >
            {{
              t("product.cycle", {
                value: item?.monthly_price_from_discounted
                  ? item.monthly_price_from_discounted_formatted
                  : item.monthly_price_from_formatted,
              })
            }}
          </span>
        </div>

        <div :class="styles.product.config.grid.item.footer">
          <span
            :class="styles.product.config.grid.item.discount"
            v-if="item?.price_discounted"
          >
            {{ item.price_formatted }}
          </span>
          <strong :class="styles.product.config.grid.item.total">
            {{
              item?.price_discounted
                ? item.price_discounted_formatted
                : item?.price
                  ? item.price_formatted
                  : t("product.free")
            }}
          </strong>
        </div>
      </template>
    </RadioCards>
  </FormField>

  <pre v-if="errors">{{ errors }}</pre>
</template>

<script lang="ts" setup>
// --- external
import { computed, toRefs } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles, cn } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { RadioCards, FormField, Badge } from "@upmind/upwind";

// --- utils
import { isNil, map } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { RadioCardsItemProps } from "@upmind/upwind";
import { parse } from "vue/compiler-sfc";
// -----------------------------------------------------------------------------
const emits = defineEmits(["update:modelValue"]);
const props = withDefaults(
  defineProps<{
    items: Object[];
    modelValue?: string | number;
    errors?: string;
    // ---
    label?: string;
    description?: string;
    // --- state
    required?: boolean;
    disabled?: boolean;
    loading?: boolean;
    processing?: boolean;
    visible?: boolean;
  }>(),
  {
    required: true,
    disabled: false,
    loading: false,
    processing: false,
    visible: true,
  }
);

const { t } = useI18n();

const styles = useStyles(
  ["product.config.grid", "product.config.grid.item"],
  toRefs(props),
  config
);

const parsedValues = computed<RadioCardsItemProps[]>(() => {
  return map(props.items, item => {
    return {
      id: item.billing_cycle_months,
      value: item.billing_cycle_months,
      label: item.billing_cycle_name,
      ...item,
    };
  });
});

const hasItems = computed(() => {
  return !isNil(props.modelValue) && !!props.items?.length;
});

function doResolve(item: string | number) {
  if (props.disabled) return;
  emits("update:modelValue", item);
}
</script>
