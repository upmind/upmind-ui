<template>
  <section class="m-0 w-full">
    <header class="flex flex-1 items-start gap-x-1">
      <div class="flex flex-grow flex-col gap-0.5 md:flex-row md:gap-x-2">
        <div class="flex flex-wrap items-center gap-2">
          <h5 class="m-0 font-medium">{{ title }}</h5>

          <Promotion
            v-for="promotion in props.promotions"
            :key="promotion.code.toString()"
            v-bind="promotion"
          />
        </div>

        <div
          v-if="props.price && !props.meta?.free"
          class="my-1 flex items-center gap-x-1 text-xs md:hidden"
        >
          <SubproductCardPricing
            v-if="props.price"
            :price="props.price"
            :meta="props.meta"
            :cycle="props.cycle"
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
              :price="props.price"
              :meta="props.meta"
              :cycle="props.cycle"
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
import type { SubproductValue } from "@upmind-automation/headless-vue";
// -----------------------------------------------------------------------------
const emit = defineEmits(["update:quantity"]);
const props = defineProps<
  SubproductValue & {
    processing?: boolean;
  }
>();

// ---

const { t } = useI18n();

function doUpdateQuantity(quantity: number) {
  emit("update:quantity", quantity);
}
</script>
