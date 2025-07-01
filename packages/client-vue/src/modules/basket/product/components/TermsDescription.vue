<template>
  <Description>
    {{ t(`product.terms.billing.${props.cycle}`, [props.price.currentPrice])
    }}<template v-if="props.meta?.discounted && props.cycle !== 0">. </template>
    <template v-if="props.meta?.discounted && props.cycle !== 0"
      >{{ t("product.terms.renews", [props.price.regularPrice])
      }}<template v-if="props.showTaxes">.</template>
    </template>
    <template v-if="props.showTaxes">
      <template v-if="props.meta?.includesTax"
        >{{ t("product.terms.taxes") }}.</template
      >
      <template v-else>{{ t("product.terms.taxesExcluded") }}.</template>
    </template>
  </Description>
</template>

<script lang="ts" setup>
// components
import Description from "../../../../components/content/Description.vue";

// --- external
import { useI18n } from "vue-i18n";

// --- types
import type { TermDetails } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = withDefaults(defineProps<TermDetails>(), {
  showTaxes: true
});
</script>
