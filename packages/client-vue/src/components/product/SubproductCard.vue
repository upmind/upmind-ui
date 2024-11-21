<template>
  <section class="m-0 w-full">
    <header class="flex flex-1 items-start gap-x-1">
      <div class="flex flex-grow flex-col gap-0.5 md:flex-row md:gap-x-2">
        <h5 class="m-0 font-medium">{{ name }}</h5>

        <div class="flex flex-wrap items-center gap-2 md:block">
          <div class="my-1 text-xs md:hidden">
            <SubproductCardPricing
              :price="props.price"
              :priceOverride="props.priceOverride"
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
                        value: promotion.amountFormatted,
                      })
                }}
              </Badge>
            </template>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <NumberField
          v-if="quantifiable && quantity"
          :disabled="processing"
          :min="min"
          :max="max"
          :step="step"
          :model-value="quantity"
          :default-value="quantity || step"
          @update:modelValue="doUpdateQuantity"
          size="sm"
          width="sm"
        />

        <div class="hidden flex-col text-right font-semibold md:flex">
          <span class="flex flex-shrink-0 items-center justify-end gap-x-1">
            <SubproductCardPricing
              :price="props.price"
              :priceOverride="props.priceOverride"
            />
          </span>
        </div>
      </div>
    </header>

    <p
      class="text-base-700 mb-0 mt-2 whitespace-normal text-xs leading-tight"
      v-if="props.excerpt"
    >
      {{ props.excerpt }}
    </p>
  </section>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- internal

// --- components
import { Badge, NumberField } from "@upmind-automation/upwind";
import SubproductCardPricing from "./SubproductCardPricing.vue";

// --- types

// -----------------------------------------------------------------------------
const emit = defineEmits(["update:quantity"]);
const props = defineProps<{
  id?: string;
  name: string;
  excerpt?: string;
  priceOverride?: boolean;
  price?: {
    price: number;
    priceFormatted: string;
    priceDiscounted: number;
    priceDiscountedFormatted: string;
    promotions: Array<{
      id: string;
      amount: number;
      amountFormatted: string;
      mixed: boolean;
    }>;
  };
  quantifiable: boolean;
  min?: number;
  max?: number;
  step?: number;
  quantity?: number;
  processing?: boolean;
}>();

// ---

const { t } = useI18n();

function doUpdateQuantity(quantity: number) {
  emit("update:quantity", quantity);
}
</script>
