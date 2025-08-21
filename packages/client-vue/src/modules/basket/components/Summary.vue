<template>
  <div v-if="!meta.isLoading" :class="styles.summary.root">
    <DescriptionList :items="items">
      <div :class="styles.summary.item.root">
        <dt :class="styles.summary.item.term">
          {{ t("basket.summary.total") }}
        </dt>
        <dd :class="styles.summary.item.description">
          {{ summary?.total }}
        </dd>
      </div>
    </DescriptionList>

    <!-- promotions -->
    <BasketPromotions />
  </div>

  <template v-else>
    <SummarySkeleton />
  </template>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { toPairs, forEach, isEmpty } from "lodash-es";

// --- components
import { DescriptionList } from "@upmind-automation/upmind-ui";
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
  }>(),
  {
    showProducts: false
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

const items = computed(() => {
  const items = subtotalItems.value;

  if (!isEmpty(summary.value?.products) && props.showProducts) {
    items.push(...productItems.value);
  }

  return items;
});

const productItems = computed(() => {
  return (
    summary.value?.products?.map((product: any) => ({
      term: product.title,
      description: product.summary.currentPrice
    })) ?? []
  );
});

const subtotalItems = computed(() => {
  const items = [];

  if (!isEmpty(summary.value?.discount)) {
    items.push({
      term: t("basket.summary.discount.title", products?.value?.length ?? 0),
      description: summary.value.discount
    });
  }

  if (!isEmpty(summary.value?.subtotal)) {
    items.push({
      term: t("basket.summary.subtotal.title", products?.value?.length ?? 0),
      description: summary.value.subtotal
    });
  }

  if (!isEmpty(summary.value?.taxes)) {
    forEach(toPairs(summary.value.taxes), ([key, value]) => {
      items.push({
        term: key,
        description: value
      });
    });
  }

  return items;
});
</script>
