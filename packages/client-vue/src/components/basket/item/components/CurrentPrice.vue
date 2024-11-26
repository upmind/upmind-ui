<template>
  <div
    class="text-lg font-semibold leading-[30px] md:text-xl"
    :class="{ 'opacity-0': meta.isLoading || meta.isCalculating }"
  >
    {{ pricing.meta?.free ? t("product.free") : pricing.currentPrice }}
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useBasketProduct } from "@upmind-automation/client-vue";

// --- types
import { type BasketProductSummaryPrice } from "@upmind-automation/client-vue";

const { t } = useI18n();

const props = defineProps<{
  id: string;
  pricing: BasketProductSummaryPrice;
}>();

const { meta } = useBasketProduct(props.id);
</script>
