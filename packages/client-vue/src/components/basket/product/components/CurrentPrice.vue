<template>
  <span
    class="text-lg font-semibold leading-[30px] md:text-xl"
    :class="{ 'opacity-0': loading || processing }"
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
  loading?: boolean;
  processing?: boolean;
  free?: boolean;
  currentPrice?: string;
}>();
</script>
