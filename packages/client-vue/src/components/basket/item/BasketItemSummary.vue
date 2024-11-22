<template>
  <div class="flex flex-col gap-y-1 md:gap-y-2">
    <div class="flex items-center justify-between">
      <div class="flex w-full items-center gap-x-3">
        <img
          v-if="product.imgUrl"
          :src="product.imgUrl"
          alt="Upmind"
          class="m-0 h-12 w-12"
        />

        <div class="flex w-full flex-col gap-y-1">
          <div class="flex items-end justify-between">
            <div class="text-sm font-normal leading-[15px]">
              {{ product.category }}
            </div>
            <Promotion class="hidden md:block" :pricing="pricing" />
          </div>
          <div class="flex items-end justify-between">
            <div class="text-[22px] font-semibold leading-[30px]">
              {{ product.name }}
              <template v-if="props.product.serviceIdentifier">
                ({{ product.serviceIdentifier }})
              </template>
            </div>

            <div class="hidden gap-x-[24px] md:flex">
              <QuantityField
                :id="props.id"
                :product="props.product"
                :quantity="props.quantity"
              />
              <CurrentPrice :pricing="pricing" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="md:hidden">
      <TermsDescription :pricing="pricing" />
      <div class="flex items-center justify-between">
        <CurrentPrice :pricing="pricing" />
        <QuantityField
          :id="props.id"
          :product="props.product"
          :quantity="props.quantity"
        />
      </div>
    </div>

    <div class="hidden justify-between md:flex">
      <TermsDescription :pricing="pricing" />
      <RegularPrice :pricing="pricing" />
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { debounce } from "lodash-es";

// --- internal
import { useBasketProduct } from "@upmind-automation/client-vue";

// --- components
import CurrentPrice from "./components/CurrentPrice.vue";
import RegularPrice from "./components/RegularPrice.vue";
import TermsDescription from "./components/TermsDescription.vue";
import Promotion from "./components/Promotion.vue";
import QuantityField from "./components/QuantityField.vue";

// --- types
import {
  type BasketProductDetails,
  type BasketProductSummaryPrice,
} from "@upmind-automation/client-vue";

const props = defineProps<{
  id: string;
  product: BasketProductDetails;
  pricing: BasketProductSummaryPrice;
  quantity: number;
}>();

const { t } = useI18n();

const { updateQuantity } = useBasketProduct(props.id);

const doUpdateQuantity = debounce((value: number) => {
  updateQuantity(value);
}, 750);
</script>
