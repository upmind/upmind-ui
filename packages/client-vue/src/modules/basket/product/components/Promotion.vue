<template>
  <Badge
    v-if="meta?.discounted && price"
    :color="disabled ? 'danger' : 'promo'"
    variant="muted"
    class="uppercase"
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
