<template>
  <Badge
    v-if="meta?.discounted && price"
    :color="disabled ? 'warning' : 'promo'"
    variant="muted"
    :label="
      t('action.save_value', {
        value: price.savingPercent
      })
    "
    :size="size"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind-automation/upmind-ui";
import type { PromotionProps } from "./types";

withDefaults(defineProps<PromotionProps>(), {
  size: "sm"
});

const { t } = useI18n();
</script>
