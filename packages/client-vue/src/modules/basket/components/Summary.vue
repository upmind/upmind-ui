<template>
  <div
    v-if="(!meta.isLoading && meta.hasProducts) || meta.isCheckout"
    :class="styles.summary.root"
  >
    <DescriptionList :items="items" class="font-normal">
      <div :class="styles.summary.item.root">
        <dt :class="styles.summary.item.term">
          {{ t("text.total") }}
        </dt>
        <dd :class="styles.summary.item.description">
          {{ summary?.total }}
        </dd>
      </div>
    </DescriptionList>

    <!-- promotions -->
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

// --- internal
import { useBasket } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./summary.config";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    showProducts?: boolean;
    showPromotions?: boolean;
  }>(),
  {
    showProducts: false,
    showPromotions: true
  }
);

const emits = defineEmits(["edit"]);

const { t } = useI18n();
const { meta, products, summary } = useBasket();

const styles = useStyles(
  ["summary", "summary.item"],
  props,
  config
) as ComputedRef<{
  summary: {
    root: string;
    item: {
      root: string;
      term: string;
      description: string;
    };
  };
}>;

const items = computed((): DescriptionItem[] => {
  let items = subtotalItems.value as DescriptionItem[];

  if (!isEmpty(summary.value?.products) && props.showProducts) {
    const productItems =
      map(summary.value!.products, (product: any) => ({
        term: product.productDetails?.name,
        description: product.price.currentPrice ?? ""
      })) ?? [];

    items = concat(productItems, items);
  }

  return items;
});

const subtotalItems = computed(() => {
  const items = [];

  if (!isEmpty(summary.value?.discount)) {
    items.push({
      term: t("text.discount", products?.value?.length ?? 0),
      description: summary.value!.discount
    });
  }

  if (!isEmpty(summary.value?.subtotal)) {
    items.push({
      term: t("text.subtotal", products?.value?.length ?? 0),
      description: summary.value!.subtotal
    });
  }

  if (!isEmpty(summary.value?.taxes)) {
    forEach(summary.value!.taxes, tax => {
      items.push({
        term: tax.title,
        description: tax.amount
      });
    });
  }

  return items;
});
</script>
