<template>
  <div :class="styles.product.summary.container">
    <div class="flex flex-col md:gap-y-1">
      <Promotion
        v-if="primary"
        v-bind="pricing"
        :discounted="pricing.meta?.discounted"
        :disabled="error"
        size="md"
        class="mb-2 inline-block md:hidden"
      />
      <div class="flex items-center justify-between">
        <div class="flex w-full items-center gap-x-3">
          <router-link
            v-if="primary && product.imgUrl"
            :to="editLink"
            :class="styles.product.summary.imageRoute"
          >
            <img :src="product.imgUrl" :class="styles.product.summary.image" />
          </router-link>

          <div class="flex w-full flex-col gap-y-1">
            <div class="flex items-end justify-between">
              <div class="text-sm font-normal leading-5">
                {{ pricing.category }}
              </div>
              <Promotion
                v-if="primary"
                v-bind="pricing"
                :discounted="pricing.meta?.discounted"
                :disabled="error"
                class="-mt-3 hidden md:block"
              />
            </div>
            <div class="flex items-end justify-between">
              <router-link
                :to="editLink"
                class="text-inherit underline-offset-2"
              >
                <strong class="text-xl font-semibold leading-7">
                  {{ pricing.name }}
                  <template v-if="pricing.serviceIdentifier">
                    ({{ pricing.serviceIdentifier }})
                  </template>
                </strong>
              </router-link>

              <div class="hidden items-center gap-x-6 md:flex">
                <QuantityField
                  v-bind="product"
                  :id="id"
                  :quantity="pricing.quantity"
                  :quantifiable="product.quantifiable"
                  @update:quantity="doUpdateQuantity"
                />
                <CurrentPrice
                  :id="id"
                  :loading="loading"
                  :processing="processing"
                  :free="pricing.meta?.free"
                  :current-price="pricing.currentPrice"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-1 flex flex-col gap-y-1 md:hidden">
        <TermsDescription
          v-bind="pricing"
          :discounted="pricing.meta?.discounted"
          :free="pricing.meta?.free"
          :one-off="pricing.meta?.oneoff"
          :taxes="taxes"
        />
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-x-2">
            <CurrentPrice
              :id="id"
              :loading="loading"
              :processing="processing"
              :free="pricing.meta?.free"
              :current-price="pricing.currentPrice"
            />
            <RegularPrice
              :discounted="pricing.meta?.discounted"
              :regular-price="pricing.regularPrice"
            />
          </div>
          <QuantityField
            v-bind="product"
            :id="id"
            :quantity="pricing.quantity"
            :quantifiable="product.quantifiable"
            @update:quantity="doUpdateQuantity"
          />
        </div>
      </div>

      <div class="hidden justify-between md:flex">
        <TermsDescription
          v-bind="pricing"
          :discounted="pricing.meta?.discounted"
          :free="pricing.meta?.free"
          :one-off="pricing.meta?.oneoff"
          :taxes="taxes"
        />
        <RegularPrice
          :discounted="pricing.meta?.discounted"
          :regular-price="pricing.regularPrice"
        />
      </div>
    </div>

    <slot />

    <template v-if="primary && error">
      <UpmRequiredAlert :id="id" />
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- components
import UpmRequiredAlert from "./components/RequiredAlert.vue";
import CurrentPrice from "./components/CurrentPrice.vue";
import RegularPrice from "./components/RegularPrice.vue";
import TermsDescription from "./components/TermsDescription.vue";
import Promotion from "./components/Promotion.vue";
import QuantityField from "./components/QuantityField.vue";

// --- internal
import { useStyles } from "@upmind-automation/upwind";
import config from "./config.cva";

// --- types
import { type BasketProductSummaryProps } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<BasketProductSummaryProps>();

const emits = defineEmits(["update:quantity"]);

const styles = useStyles(["product.summary"], props, config) as ComputedRef<{
  product: {
    summary: {
      container: string;
      image: string;
      imageRoute: string;
    };
  };
}>;

function doUpdateQuantity(value: number) {
  emits("update:quantity", value);
}
</script>
