<template>
  <div v-if="discounted">
    <Badge
      :color="disabled ? 'disabled' : 'promotion'"
      variant="tonal"
      class="uppercase"
      :label="
        currentSavingAmount && currentSavingAmount >= 10
          ? t('product.promotionSave', [currentSaving])
          : t('product.promotion')
      "
      :size="size"
    />
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind-automation/upwind";

withDefaults(
  defineProps<{
    discounted?: boolean;
    currentSaving?: string;
    currentSavingAmount?: number;
    disabled?: boolean;
    size?: "xs" | "md";
  }>(),
  {
    size: "xs",
  }
);

const { t } = useI18n();
</script>
