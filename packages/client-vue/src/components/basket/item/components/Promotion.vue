<template>
  <Badge
    v-if="props.pricing.meta?.discounted"
    class="-mt-2 mb-1 !px-[6px] !py-[2px] !text-[12px] !leading-[16.8px]"
    color="promotion"
    variant="tonal"
    size="sm"
    :label="t('product.promotion')"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind-automation/upwind";
import type { BasketProductSummaryPrice } from "@upmind-automation/client-vue";

const props = defineProps<{
  pricing: BasketProductSummaryPrice;
}>();

const { t } = useI18n();
</script>
