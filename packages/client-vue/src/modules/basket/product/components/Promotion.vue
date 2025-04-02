<template>
  <Badge
    v-if="discounted"
    :color="disabled ? 'disabled' : 'promotion'"
    variant="tonal"
    class="rounded-lg uppercase"
    :label="t('product.promotionSave', [currentSavingPercent])"
    :size="size"
  />
  <pre>{{ (currentSaving, currentSavingAmount, currentSavingPercent) }}</pre>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind-automation/upmind-ui";

withDefaults(
  defineProps<{
    discounted?: boolean;
    currentSaving?: string;
    currentSavingAmount?: number;
    currentSavingPercent?: string;
    disabled?: boolean;
    size?: "xs" | "sm" | "md";
    mixed?: boolean;
  }>(),
  {
    size: "xs",
  }
);

const { t } = useI18n();
</script>
