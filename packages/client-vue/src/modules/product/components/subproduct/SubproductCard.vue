<template>
  <section class="text-foreground m-0 flex w-full flex-col gap-1">
    <header class="flex flex-1 items-start gap-2">
      <div class="flex grow flex-col gap-0.5 md:flex-row md:gap-x-2">
        <div class="flex flex-wrap items-center gap-2">
          <h5 class="text-md/tight m-0 font-medium">{{ title }}</h5>

          <Promotion
            v-for="promotion in props.promotions"
            :key="promotion.code.toString()"
            v-bind="promotion"
            size="sm"
          />
        </div>

        <div
          v-if="props.price && !props.meta?.free"
          class="text-md/tight items-center gap-x-1 max-md:flex md:hidden"
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

        <div
          class="text-md/tight hidden flex-col gap-2 text-right md:flex md:flex-row"
        >
          <SubproductCardPricing
            v-if="props.price"
            :price="props.price"
            :meta="props.meta"
            :cycle="props.cycle"
          />
        </div>
      </div>
    </header>

    <p
      class="text-emphasis-medium text-sm/tight whitespace-normal"
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
import type { SubproductValue } from "@upmind-automation/headless";
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
