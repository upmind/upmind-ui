<template>
  <div v-if="!meta.isLoading">
    <!-- products -->
    <dl
      class="m-0 border-t py-4 text-sm first-of-type:border-t-0 first-of-type:pt-0"
      v-if="summary?.products?.length && props.showProducts"
      v-auto-animate
    >
      <div
        v-for="product in summary.products"
        :key="product.id"
        class="flex flex-col space-y-1"
      >
        <div class="flex w-full flex-wrap justify-between gap-2">
          <div
            class="text-primary group m-0 inline-flex flex-1 items-end gap-2 text-left text-sm font-medium leading-normal"
          >
            <span>{{ product?.name }}</span>
            <span v-if="product?.serviceIdentifier">
              ({{ product?.serviceIdentifier }})
            </span>
          </div>

          <div
            class="text-base-foreground m-0 break-all text-right font-medium leading-normal"
          >
            <slot name="actions" v-bind="{ ...$props, product }">
              <strong class="text-primary" v-if="props.noActions">
                {{ product.summary.currentPrice }}
              </strong>

              <template v-else>
                <Button
                  type="button"
                  size="sm"
                  class="!p-0"
                  icon-only
                  label="modify product"
                  prependIcon="edit"
                  @click="emits('edit', product.id)"
                  disabled
                />
                <Button
                  type="button"
                  size="sm"
                  class="!p-0"
                  icon-only
                  label="remove product"
                  prependIcon="remove"
                  @click="removeItem(product.id)"
                />
              </template>
            </slot>
          </div>
        </div>
      </div>
    </dl>

    <!-- subtotals -->
    <dl
      class="text-primary m-0 grid grid-cols-2 gap-0 border-t py-4 text-sm first-of-type:border-t-0 first-of-type:pt-0"
      v-if="!!summary?.discount || !!summary?.taxes"
      v-auto-animate
    >
      <template v-if="summary?.discount">
        <dt
          class="text-primary group m-0 inline-flex flex-1 items-center gap-2 text-left text-sm font-normal leading-normal"
        >
          <span
            class="text-emphasis-medium m-0 inline-flex items-end gap-2 text-left text-sm font-normal leading-normal"
            >{{ t("basket.summary.discount.title", products.length) }}</span
          >
        </dt>

        <dd
          class="flex-0 text-emphasis-medium m-0 block text-right font-medium"
        >
          {{ summary.discount }}
        </dd>
      </template>

      <template v-if="summary?.subtotal">
        <dt
          class="text-primary group m-0 inline-flex flex-1 items-center gap-2 text-left text-sm font-normal leading-normal"
        >
          <span
            class="text-emphasis-medium m-0 inline-flex items-end gap-2 text-left text-sm font-normal leading-normal"
            >{{ t("basket.summary.subtotal.title", products.length) }}</span
          >
        </dt>

        <dd
          class="flex-0 text-emphasis-medium m-0 block text-right font-medium"
        >
          {{ summary.subtotal }}
        </dd>
      </template>

      <template v-for="(value, key) in summary?.taxes" :key="key">
        <dt
          class="text-primary group m-0 inline-flex flex-1 items-center gap-2 text-left text-sm font-normal leading-normal"
        >
          <span
            class="text-emphasis-medium m-0 inline-flex items-end gap-2 text-left text-sm font-normal leading-normal"
            >{{ key }}</span
          >
        </dt>

        <dd
          class="flex-0 text-emphasis-medium m-0 block text-right font-medium"
        >
          {{ value }}
        </dd>
      </template>
    </dl>

    <!-- total -->
    <div class="flex flex-col gap-4 border-t">
      <dl class="m-0 flex flex-wrap justify-between space-x-2 pt-4 text-lg">
        <span class="text-primary m-0 font-bold">
          {{ t("basket.summary.total") }}
        </span>
        <span class="text-primary m-0 break-all font-bold">
          {{ summary?.total }}
        </span>
      </dl>

      <!-- promotions -->
      <BasketPromotions />
    </div>
  </div>

  <template v-else>
    <SummarySkeleton />
  </template>
</template>

<script lang="ts" setup>
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- components
import { Button } from "@upmind-automation/upmind-ui";
import BasketPromotions from "./Promotions.vue";
import SummarySkeleton from "./SummarySkeleton.vue";

// --- internal
import { useBasket } from "@upmind-automation/headless-vue";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    noActions: boolean;
    showProducts?: boolean;
  }>(),
  {
    showProducts: false,
  }
);

const emits = defineEmits(["edit"]);

const { t } = useI18n();
const { meta, removeItem, products, summary } = useBasket();
</script>
