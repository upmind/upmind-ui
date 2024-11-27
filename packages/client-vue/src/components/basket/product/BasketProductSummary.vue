<template>
  <div class="flex flex-col md:gap-y-1">
    <div class="flex items-center justify-between">
      <div class="flex w-full items-center gap-x-3">
        <img
          v-if="primary && product.imgUrl"
          :src="product.imgUrl"
          alt="Upmind"
          class="m-0 h-12 w-12"
        />

        <div class="flex w-full flex-col gap-y-1">
          <Promotion
            v-if="primary"
            class="mb-2 inline-block md:hidden"
            :discounted="pricing.meta?.discounted"
            :current-saving="pricing.currentSaving"
            :current-saving-amount="pricing.currentSavingAmount"
            :disabled="error"
            size="md"
          />
          <div class="flex items-end justify-between">
            <div class="text-sm font-normal leading-[15px]">
              {{ pricing.category }}
            </div>
            <Promotion
              v-if="primary"
              class="-mt-3 hidden md:block"
              :discounted="pricing.meta?.discounted"
              :current-saving="pricing.currentSaving"
              :current-saving-amount="pricing.currentSavingAmount"
              :disabled="error"
            />
          </div>
          <div class="flex items-end justify-between">
            <div class="text-xl font-semibold leading-[30px]">
              {{ pricing.name }}
              <template v-if="pricing.serviceIdentifier">
                ({{ pricing.serviceIdentifier }})
              </template>
            </div>

            <div class="hidden items-center gap-x-[24px] md:flex">
              <QuantityField
                :id="id"
                :quantity="pricing.quantity"
                :quantifiable="product.quantifiable"
                :min="product.min"
                :max="product.max"
                :step="product.step"
              />
              <CurrentPrice
                :id="id"
                :is-loading="meta.isLoading"
                :is-calculating="meta.isCalculating"
                :free="pricing.meta?.free"
                :current-price="pricing.currentPrice"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-y-1 md:hidden">
      <TermsDescription
        :cycle="pricing.cycle"
        :regular-price="pricing.regularPrice"
        :current-price="pricing.currentPrice"
        :discounted="pricing.meta?.discounted"
      />
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-x-2">
          <CurrentPrice
            :id="id"
            :is-loading="meta.isLoading"
            :is-calculating="meta.isCalculating"
            :free="pricing.meta?.free"
            :current-price="pricing.currentPrice"
          />
          <RegularPrice
            :discounted="pricing.meta?.discounted"
            :regular-price="pricing.regularPrice"
          />
        </div>
        <QuantityField
          :id="id"
          :quantity="pricing.quantity"
          :quantifiable="product.quantifiable"
          :min="product.min"
          :max="product.max"
          :step="product.step"
        />
      </div>
    </div>

    <div class="hidden justify-between md:flex">
      <TermsDescription
        :cycle="pricing.cycle"
        :regular-price="pricing.regularPrice"
        :current-price="pricing.currentPrice"
        :discounted="pricing.meta?.discounted"
      />
      <RegularPrice
        :discounted="pricing.meta?.discounted"
        :regular-price="pricing.regularPrice"
      />
    </div>
  </div>

  <template v-if="primary && error">
    <UpmRequiredAlert :id="id" />
  </template>

  <div v-if="!isLast" class="h-[1px] border-t border-dashed" />
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { debounce } from "lodash-es";
import { computed } from "vue";

// --- internal
import { useBasketProduct } from "@upmind-automation/client-vue";

// --- components
import UpmRequiredAlert from "./components/RequiredAlert.vue";
import CurrentPrice from "./components/CurrentPrice.vue";
import RegularPrice from "./components/RegularPrice.vue";
import TermsDescription from "./components/TermsDescription.vue";
import Promotion from "./components/Promotion.vue";
import QuantityField from "./components/QuantityField.vue";

// --- types
import type {
  BasketProductSummaryPrice,
  BasketProductDetails,
} from "@upmind-automation/client-vue";

const props = defineProps<{
  id: string;
  pricing: BasketProductSummaryPrice;
  product: BasketProductDetails;
  error: boolean;
  primary: boolean;
  isLast: boolean;
}>();

const { t } = useI18n();

const { updateQuantity, meta } = useBasketProduct(props.id);

const isProduct = computed(() => props.pricing.key === "term");

const doUpdateQuantity = debounce((value: number) => {
  updateQuantity(value);
}, 750);
</script>
