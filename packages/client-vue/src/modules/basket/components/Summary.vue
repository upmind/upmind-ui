<template>
  <div
    v-if="(!meta.isLoading && meta.hasProducts) || meta.isCheckout"
    :class="styles.summary.root"
  >
    <DescriptionList v-if="!isEmpty(productItems)" :items="productItems">
      <template #description="{ item }">
        <Skeleton
          v-if="meta.isPricesCalculating"
          :class="styles.summary.skeleton"
        />
        <template v-else>{{ item.description }}</template>
      </template>
    </DescriptionList>

    <DescriptionList v-if="!isEmpty(subtotalItems)" :items="subtotalItems">
      <template #description="{ item }">
        <Skeleton
          v-if="meta.isPricesCalculating"
          :class="styles.summary.skeleton"
        />
        <template v-else>{{ item.description }}</template>
      </template>
      <BasketTotal class="mt-2" v-if="props.showTotal" />
    </DescriptionList>

    <BasketPromotions v-if="props.showPromotions" />
  </div>

  <template v-else>
    <SummarySkeleton />
  </template>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBasket, useConfig } from "@upmind-automation/headless";
import { useMoney } from "@upmind-automation/headless";
import {
  DescriptionList,
  Skeleton,
  type DescriptionItem
} from "@upmind-automation/upmind-ui";
import { useStyles } from "@upmind-automation/upmind-ui";
import BasketTotal from "./BasketTotal.vue";
import BasketPromotions from "./Promotions.vue";
import config from "./summary.config";
import SummarySkeleton from "./SummarySkeleton.vue";
import { forEach, isEmpty, map, concat } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    showProducts?: boolean;
    showPromotions?: boolean;
    showTotal?: boolean;
  }>(),
  {
    showProducts: false,
    showPromotions: true,
    showTotal: true
  }
);

const _emits = defineEmits(["edit"]);

const { t } = useI18n();
const { meta, products, summary } = useBasket();
const { ui: _ui, data } = useConfig();
const { formatPrice } = useMoney();

const styles = useStyles(["summary", "summary.item"], props, config);

const productItems = computed((): DescriptionItem[] => {
  let items = [] as DescriptionItem[];

  if (!isEmpty(summary.value?.products) && props.showProducts) {
    const productItems: DescriptionItem[] =
      map(summary.value!.products, (product: any) => {
        const { data } = useConfig({
          product
        });

        return {
          term: data.productName || product?.productDetails?.title || "",
          description:
            formatPrice(product?.price?.basePrice, {
              trimTrailingZeroes: data.trimTrailingZeroes
            }) || "",
          dataAttrs: { "data-test-key": "description-list-item-product" }
        };
      }) ?? [];

    items = concat(productItems, items);
  }

  return items;
});

const subtotalItems = computed(() => {
  const items = [] as DescriptionItem[];

  if (!isEmpty(summary.value?.discount)) {
    items.push({
      term: t("text.discount", products?.value?.length || 0),
      description:
        formatPrice(summary?.value?.discount, {
          trimTrailingZeroes: data.trimTrailingZeroes
        }) || ""
    });
  }

  if (!isEmpty(summary.value?.subtotal)) {
    items.push({
      term: t("text.subtotal", products?.value?.length || 0),
      description:
        formatPrice(summary?.value?.subtotal, {
          trimTrailingZeroes: data.trimTrailingZeroes
        }) || ""
    });
  }

  if (!isEmpty(summary.value?.taxes)) {
    forEach(summary.value!.taxes, tax => {
      items.push({
        term: tax?.title || "",
        description:
          formatPrice(tax?.amount, {
            trimTrailingZeroes: data.trimTrailingZeroes
          }) || ""
      });
    });
  }

  return items;
});
</script>
