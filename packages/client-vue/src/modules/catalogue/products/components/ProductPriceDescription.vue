<template>
  <Description>
    {{ t(`product.terms.price.${props.cycle}`, [props.price.currentPrice]) }}
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

const props = defineProps<TermDetails & {}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
</script>
