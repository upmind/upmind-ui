<template>
  <div
    v-if="(!meta.isLoading && meta.hasProducts) || meta.isCheckout"
    :class="styles.summary.root"
  >
    <DescriptionList v-if="!isEmpty(productItems)" :items="productItems" />

    <DescriptionList v-if="!isEmpty(subtotalItems)" :items="subtotalItems">
      <BasketTotal class="mt-2" v-if="props.showTotal" />
    </DescriptionList>

    <BasketPromotions v-if="props.showPromotions" />
  </div>

  <template v-else>
    <SummarySkeleton />
  </template>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { toPairs, forEach, isEmpty, map, concat } from "lodash-es";

// --- components
import {
  DescriptionList,
  type DescriptionItem
} from "@upmind-automation/upmind-ui";
import BasketPromotions from "./Promotions.vue";
import SummarySkeleton from "./SummarySkeleton.vue";
import BasketTotal from "./BasketTotal.vue";

// --- internal
import { useBasket } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./summary.config";

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

const emits = defineEmits(["edit"]);

const { t } = useI18n();
const { meta, products, summary } = useBasket();

const styles = useStyles(["summary", "summary.item"], props, config);

const productItems = computed((): DescriptionItem[] => {
  let items = [] as DescriptionItem[];

  if (!isEmpty(summary.value?.products) && props.showProducts) {
    const productItems =
      map(summary.value!.products, (product: any) => ({
        term: product?.productDetails?.title || "",
        description: product?.price?.currentPrice || ""
      })) ?? [];

    items = concat(productItems, items);
  }

  return items;
});

const subtotalItems = computed(() => {
  const items = [] as DescriptionItem[];

  if (!isEmpty(summary.value?.discount)) {
    items.push({
      term: t("text.discount", products?.value?.length || 0),
      description: summary?.value?.discount || ""
    });
  }

  if (!isEmpty(summary.value?.subtotal)) {
    items.push({
      term: t("text.subtotal", products?.value?.length || 0),
      description: summary?.value?.subtotal || ""
    });
  }

  if (!isEmpty(summary.value?.taxes)) {
    forEach(summary.value!.taxes, tax => {
      items.push({
        term: tax?.title || "",
        description: tax?.amount || ""
      });
    });
  }

  return items;
});
</script>
