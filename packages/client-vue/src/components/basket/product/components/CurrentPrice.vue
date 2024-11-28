<template>
  <span
    class="text-lg font-semibold leading-[30px] md:text-xl"
    :class="{ 'opacity-0': isLoading || isCalculating }"
  >
    {{ free ? t("product.free") : currentPrice }}
  </span>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{
  id: string;
  isLoading?: boolean;
  isCalculating?: boolean;
  free?: boolean;
  currentPrice?: string;
}>();
</script>
