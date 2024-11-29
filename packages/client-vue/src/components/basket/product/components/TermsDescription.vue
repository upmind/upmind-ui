<template>
  <p v-if="!free" class="my-0 text-sm italic leading-5 opacity-35">
    {{ t(`product.terms.billing.${cycle}`, [currentPrice]) }}
    <template v-if="discounted && !oneOff"
      >. {{ t("product.terms.renews", [regularPrice]) }}
    </template>
    <template v-if="taxes">{{ t("product.terms.taxes") }}</template>
  </p>
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
    oneOff?: boolean;
    free?: boolean;
    taxes?: boolean;
  }>(),
  {
    taxes: true,
  }
);
</script>
