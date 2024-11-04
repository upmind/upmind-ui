<template>
  <section class="m-0 w-full">
    <header class="flex flex-1 items-start gap-x-1">
      <div class="flex flex-grow flex-col gap-0.5 md:flex-row md:gap-x-2">
        <h5 class="m-0 font-medium">{{ name }}</h5>

        <div class="flex flex-wrap items-center gap-2 md:block">
          <div class="my-1 text-xs md:hidden">
            <SubproductCardPricing
              :price="props.price"
              :price-override="props.price_override"
            />
          </div>

          <div class="ml-0">
            <template
              v-for="promotion in props.price?.promotions"
              :key="promotion.id"
            >
              <Badge color="promotion" variant="tonal" size="xs" class="-mt-1">
                {{
                  promotion.mixed || !promotion.amount
                    ? t("product.promotion")
                    : t("product.promotion_save", {
                        value: promotion.amount_formatted,
                      })
                }}
              </Badge>
            </template>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <NumberField
          v-if="canChangeQuantity && quantity"
          :disabled="processing"
          :min="min_order_quantity"
          :max="max_order_quantity"
          :step="unit_quantity"
          :model-value="quantity"
          :default-value="quantity || unit_quantity"
          @update:modelValue="doUpdateQuantity"
          size="sm"
          width="sm"
        />

        <div class="hidden flex-col text-right font-semibold md:flex">
          <span class="flex flex-shrink-0 items-center justify-end gap-x-1">
            <SubproductCardPricing
              :price="props.price"
              :price-override="props.price_override"
            />
          </span>
        </div>
      </div>
    </header>

    <p
      class="text-base-700 mb-0 mt-2 whitespace-normal text-xs leading-tight"
      v-if="props.short_description"
    >
      {{ props.short_description }}
    </p>
  </section>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { NumberField } from "@upmind/upwind";

// --- components
import { Icon, Tooltip, Badge } from "@upmind/upwind";
import SubproductCardPricing from "./SubproductCardPricing.vue";

// --- types

// -----------------------------------------------------------------------------
const emit = defineEmits(["update:quantity"]);
const props = defineProps<{
  id?: string;
  name: string;
  short_description?: string;
  price_override?: boolean;
  price?: {
    price: number;
    price_formatted: string;
    price_discounted: number;
    price_discounted_formatted: string;
    promotions: Array<{
      id: string;
      amount: number;
      amount_formatted: string;
      mixed: boolean;
    }>;
  };
  canChangeQuantity: boolean;
  min_order_quantity?: number;
  max_order_quantity?: number;
  unit_quantity?: number;
  quantity?: number;
  processing?: boolean;
}>();

// ---

const { t } = useI18n();

function doUpdateQuantity(quantity: number) {
  emit("update:quantity", quantity);
}
</script>
