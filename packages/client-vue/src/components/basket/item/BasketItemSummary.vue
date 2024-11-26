<template>
  <div class="flex flex-col md:gap-y-1">
    <div class="flex items-center justify-between">
      <div class="flex w-full items-center gap-x-3">
        <img
          v-if="product.imgUrl && isFirst"
          :src="product.imgUrl"
          alt="Upmind"
          class="m-0 h-12 w-12"
        />

        <div class="flex w-full flex-col gap-y-1">
          <Promotion
            v-if="isFirst"
            class="mb-2 inline-block md:hidden"
            :pricing="pricing"
            :disabled="error"
            size="md"
          />
          <div class="flex items-end justify-between">
            <div class="text-sm font-normal leading-[15px]">
              <!-- TODO: Shouldn't need this check -->
              {{ isProduct ? product.category : pricing.category }}
            </div>
            <Promotion
              v-if="isFirst"
              class="-mt-3 hidden md:block"
              :pricing="pricing"
              :disabled="error"
            />
          </div>
          <div class="flex items-end justify-between">
            <div class="text-xl font-semibold leading-[30px]">
              {{ isProduct ? product.name : pricing.name }}
              <template
                v-if="
                  isProduct
                    ? product.serviceIdentifier
                    : pricing.serviceIdentifier
                "
              >
                ({{
                  isProduct
                    ? product.serviceIdentifier
                    : pricing.serviceIdentifier
                }})
              </template>
            </div>

            <div class="hidden items-center gap-x-[24px] md:flex">
              <QuantityField
                v-if="isFirst && props.product.quantifiable"
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

    <div class="flex flex-col gap-y-1 md:hidden">
      <TermsDescription :pricing="pricing" mobile />
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-x-2">
          <CurrentPrice :pricing="pricing" />
          <RegularPrice :pricing="pricing" />
        </div>
        <QuantityField
          v-if="isFirst && props.product.quantifiable"
          :id="props.id"
          :product="props.product"
          :quantity="props.quantity"
        />
      </div>
    </div>

    <div class="hidden justify-between md:flex">
      <TermsDescription :pricing="pricing" :mobile="false" />
      <RegularPrice :pricing="pricing" />
    </div>
  </div>

  <div v-if="isFirst && error">
    <UpmRequiredAlert class="block md:hidden" :id="id" mobile />
    <UpmRequiredAlert class="hidden md:block" :id="id" />
  </div>

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
import {
  type BasketProductDetails,
  type BasketProductSummaryPrice,
} from "@upmind-automation/client-vue";

const props = defineProps<{
  id: string;
  product: BasketProductDetails;
  pricing: BasketProductSummaryPrice;
  quantity: number;
  error: boolean;
  // More confident using this over tailwind :first due to the possibility of many summaries, badges, imgs being rendered at once (this ensures we are rendering at the correct level)
  isFirst: boolean;
  isLast: boolean;
}>();

const { t } = useI18n();

const { updateQuantity, meta } = useBasketProduct(props.id);

const isProduct = computed(() => props.pricing.key === "term");

const doUpdateQuantity = debounce((value: number) => {
  updateQuantity(value);
}, 750);
</script>
