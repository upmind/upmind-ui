<template>
  <Badge
    v-if="props.pricing.meta?.discounted"
    color="promotion"
    variant="tonal"
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
