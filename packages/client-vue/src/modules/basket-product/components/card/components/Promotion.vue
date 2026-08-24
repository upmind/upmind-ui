<template>
  <Badge
    v-if="meta?.discounted && price"
    :variant="disabled ? 'warning' : 'promo'"
    appearance="muted"
    :size="size"
  >
    {{ t("action.save_value", { value: price.savingPercent }) }}
  </Badge>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind/ui";
import type { PromotionProps } from "./types";

withDefaults(defineProps<PromotionProps>(), {
  size: "sm"
});

const { t } = useI18n();
</script>
