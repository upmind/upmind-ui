<template>
  <div v-if="pricing.meta?.discounted">
    <Badge
      :color="disabled ? 'disabled' : 'promotion'"
      variant="tonal"
      class="uppercase"
      :label="
        pricing.currentSavingAmount && pricing.currentSavingAmount >= 10
          ? t('product.promotionSave', [pricing.currentSaving])
          : t('product.promotion')
      "
      :size="size"
    />
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind-automation/upwind";
import type { BasketProductSummaryPrice } from "@upmind-automation/client-vue";

withDefaults(
  defineProps<{
    pricing: BasketProductSummaryPrice;
    disabled?: boolean;
    size?: "xs" | "md";
  }>(),
  {
    size: "xs",
  }
);

const { t } = useI18n();
</script>
