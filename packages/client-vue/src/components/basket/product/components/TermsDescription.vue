<template>
  <span class="text-sm italic leading-5 opacity-35">
    <span>{{ getTermsText() }}</span
    ><span v-if="true && cycle && cycle > 0"
      >, {{ t("product.terms.taxes") }}.</span
    >
    <span v-else>.</span>
  </span>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  cycle?: number;
  regularPrice?: string;
  currentPrice?: string;
  discounted?: boolean;
}>();

const getTermsText = () => {
  const baseText = t(`product.terms.billing.${props.cycle}`, [
    props.currentPrice,
  ]);
  if (props.discounted) {
    return (
      baseText +
      (props.cycle && (props.cycle === 0 || props.cycle >= 12)
        ? t(
            `product.terms.${props.cycle === 0 ? "discountedOneTimeSuffix" : "discountedSuffix"}`,
            [props.cycle >= 12 ? props.regularPrice : props.currentPrice]
          )
        : "")
    );
  }
  return baseText;
};
</script>
