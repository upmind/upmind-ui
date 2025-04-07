<template>
  <Badge
    v-if="discounted"
    :color="disabled ? 'disabled' : 'promotion'"
    variant="tonal"
    class="rounded-lg uppercase"
    :label="t('product.promotionSave', [savingPercent])"
    :size="size"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind-automation/upmind-ui";
import type { Promotion } from "@upmind-automation/headless-vue";

withDefaults(
  defineProps<
    Promotion & {
      disabled?: boolean;
      size?: "xs" | "sm" | "md";
    }
  >(),
  {
    size: "xs",
  }
);

const { t } = useI18n();
</script>
