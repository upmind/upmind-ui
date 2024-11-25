<template>
  <div class="-mt-3">
    <Badge
      v-if="pricing.meta?.discounted"
      :color="disabled ? 'disabled' : 'promotion'"
      variant="tonal"
      class="uppercase"
      :label="
        pricing.currentSavingAmount && pricing.currentSavingAmount >= 10
          ? t('product.promotionSave', [pricing.currentSaving])
          : t('product.promotion')
      "
      size="xs"
    />
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind-automation/upwind";
import type { BasketProductSummaryPrice } from "@upmind-automation/client-vue";

defineProps<{
  pricing: BasketProductSummaryPrice;
  disabled?: boolean;
}>();

const { t } = useI18n();
</script>
