<template>
  <Badge
    v-if="meta?.discounted && price"
    :color="disabled ? 'disabled' : 'promotion'"
    variant="tonal"
    class="uppercase"
    :label="t('product.promotionSave', [price.savingPercent])"
    :size="size"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind-automation/upmind-ui";
import type { PromotionDetails } from "@upmind-automation/headless";

withDefaults(
  defineProps<
    PromotionDetails & {
      disabled?: boolean;
      size?: "sm" | "sm" | "md";
    }
  >(),
  {
    size: "sm"
  }
);

const { t } = useI18n();
</script>
