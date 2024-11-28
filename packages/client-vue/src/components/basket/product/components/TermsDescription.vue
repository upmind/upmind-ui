<template>
  <span v-if="!free" class="text-sm italic leading-5 opacity-35">
    <span>{{ t(`product.terms.billing.${cycle}`, [currentPrice]) }}</span>
    <span v-if="discounted"
      >. {{ t("product.terms.renews", [regularPrice]) }}
    </span>
    <span v-if="taxes">{{ t("product.terms.taxes") }}</span>
  </span>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

const { t } = useI18n();

withDefaults(
  defineProps<{
    cycle?: number;
    regularPrice?: string;
    currentPrice?: string;
    discounted?: boolean;
    free?: boolean;
    taxes?: boolean;
  }>(),
  {
    taxes: true,
  }
);
</script>
