<template>
  <p class="text-emphasis-medium my-0 text-sm italic leading-5">
    {{ t(`product.terms.billing.${cycle}`, [currentPrice]) }}.
    <template v-if="discounted && cycle !== 0"
      >{{ t("product.terms.renews", [regularPrice]) }}.
    </template>
    <template v-if="taxes">{{ t("product.terms.taxes") }}.</template>
    <template v-else>{{ t("product.terms.taxesExcluded") }}.</template>
  </p>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{
  cycle?: number;
  regularPrice?: string;
  currentPrice?: string;
  discounted?: boolean;
  oneOff?: boolean;
  free?: boolean;
  taxes?: boolean;
}>();
</script>
