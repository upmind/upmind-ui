<template>
  <div :class="styles.product.summary.container">
    <div class="flex flex-col md:gap-y-1">
      <Promotion
        v-if="primary"
        v-for="(promotion, index) in summary.promotions"
        :key="index"
        v-bind="promotion"
        :disabled="error"
        size="md"
        class="mb-2 inline-block md:hidden"
      />
      <div class="flex items-center justify-between">
        <div class="flex w-full items-center gap-x-3">
          <Link
            v-if="primary && productDetails.imgUrl"
            :to="editLink"
            :class="styles.product.summary.imageRoute"
          >
            <img
              :src="productDetails.imgUrl"
              :class="styles.product.summary.image"
            />
          </Link>

          <div class="flex w-full flex-col gap-y-1">
            <div class="flex items-end justify-between">
              <div class="text-sm font-normal leading-5">
                {{ summary.category }}
              </div>
              <Promotion
                v-if="primary"
                v-for="(promotion, index) in summary.promotions"
                :key="index"
                v-bind="promotion"
                :disabled="error"
                class="-mt-3 hidden md:block"
              />
            </div>
            <div class="flex items-end justify-between">
              <Link :to="editLink" offset="2" class="min-w-0 flex-1 md:mr-8">
                <strong
                  class="break-all text-xl font-semibold leading-7 underline"
                >
                  {{ summary.title }}
                </strong>
              </Link>

              <div class="hidden items-center gap-x-6 md:flex">
                <QuantityField
                  v-bind="productDetails"
                  :id="id"
                  :quantity="quantity"
                  @update:quantity="doUpdateQuantity"
                />
                <CurrentPrice
                  :current-price="summary.price.currentPrice"
                  :meta="summary.meta"
                  :cycle="summary.cycle"
                  :ui-config="{
                    pricing: { current: styles.product.pricing.current }
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-1 flex flex-col gap-y-1 md:hidden">
        <TermsDescription v-bind="summary" />
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-x-2">
            <CurrentPrice
              :current-price="summary.price.currentPrice"
              :meta="summary.meta"
              :cycle="summary.cycle"
              :ui-config="{
                pricing: { current: styles.product.pricing.current }
              }"
            />
            <ExPrice
              :regular-price="summary.price.regularPrice"
              :meta="summary.meta"
              :cycle="summary.cycle"
              :ui-config="{ pricing: { ex: styles.product.pricing.ex } }"
            />
          </div>
          <QuantityField
            v-bind="productDetails"
            :id="id"
            :quantity="quantity"
            @update:quantity="doUpdateQuantity"
          />
        </div>
      </div>

      <div class="hidden justify-between md:flex">
        <TermsDescription v-bind="summary" />
        <ExPrice
          :regular-price="summary.price.regularPrice"
          :meta="summary.meta"
          :cycle="summary.cycle"
          :ui-config="{ pricing: { ex: styles.product.pricing.ex } }"
        />
      </div>
    </div>

    <slot />

    <template v-if="primary && error">
      <RequiredAlert :id="id" />
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- components
import { Link } from "@upmind-automation/upmind-ui";
import RequiredAlert from "./components/RequiredAlert.vue";
import CurrentPrice from "../../product/components/pricing/CurrentPrice.vue";
import ExPrice from "../../product/components/pricing/ExPrice.vue";
import TermsDescription from "./components/TermsDescription.vue";
import Promotion from "./components/Promotion.vue";
import QuantityField from "./components/QuantityField.vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";

// --- types
import { type BasketProductSummaryProps } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<BasketProductSummaryProps>();

const emits = defineEmits(["update:quantity"]);

const styles = useStyles(
  ["product.summary", "product.pricing"],
  props,
  config
) as ComputedRef<{
  product: {
    summary: {
      container: string;
      image: string;
      imageRoute: string;
    };
    pricing: {
      current: string;
      ex: string;
    };
  };
}>;

function doUpdateQuantity(value: number) {
  emits("update:quantity", value);
}
</script>
