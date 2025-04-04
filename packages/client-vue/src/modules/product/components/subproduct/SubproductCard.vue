<template>
  <section class="m-0 w-full">
    <header class="flex flex-1 items-start gap-x-1">
      <div class="flex flex-grow flex-col gap-0.5 md:flex-row md:gap-x-2">
        <div class="flex flex-wrap items-center gap-2">
          <h5 class="m-0 font-medium">{{ name }}</h5>

          <template
            v-for="promotion in props.price?.promotions"
            :key="promotion.id"
          >
            <Promotion
              :discounted="!!promotion.amount"
              :currentSaving="promotion.amountFormatted"
              :currentSavingAmount="promotion.amount"
              :mixed="promotion.mixed"
            />
          </template>
        </div>

        <div
          v-if="props.price && !props.price.meta.free"
          class="my-1 flex items-center gap-x-1 text-xs md:hidden"
        >
          <SubproductCardPricing
            :regularAmount="props.price.regularAmount"
            :regularPrice="props.price.regularPrice"
            :currentAmount="props.price.currentAmount"
            :currentPrice="props.price.currentPrice"
            :meta="props.price.meta"
          />
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
          variant="minimal"
          @click.stop
          @keydown.enter.prevent.stop
        />

        <div class="hidden flex-col text-right md:flex">
          <span class="flex flex-shrink-0 items-center justify-end gap-x-1">
            <SubproductCardPricing
              v-if="props.price"
              :regularAmount="props.price.regularAmount"
              :regularPrice="props.price.regularPrice"
              :currentAmount="props.price.currentAmount"
              :currentPrice="props.price.currentPrice"
              :meta="props.price.meta"
            />
          </span>
        </div>
      </div>
    </header>

    <p
      class="text-emphasis-medium mb-0 mt-2 whitespace-normal text-xs leading-tight"
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
import { NumberField } from "@upmind-automation/upmind-ui";
import SubproductCardPricing from "./SubproductCardPricing.vue";
import Promotion from "../../../basket/product/components/Promotion.vue";

// --- types

// -----------------------------------------------------------------------------
const emit = defineEmits(["update:quantity"]);
const props = defineProps<{
  id?: string;
  name: string;
  excerpt?: string;
  price?: {
    regularAmount: number;
    regularPrice: string;
    currentAmount: number;
    currentPrice: string;
    meta: {
      discounted?: boolean;
      free?: boolean;
    };
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
