<template>
  <Section
    v-if="meta.hasSummary"
    :label="t('cart.basket_section')"
    icon="shopping-bag-02"
  >
    <Summary :show-promotions="false" show-products />
  </Section>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Section } from "@upmind-automation/foundation";
import { useBasket } from "@upmind-automation/headless";
import Summary from "../../basket/components/Summary.vue";
import type { SessionSummaryProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<SessionSummaryProps>();

const { t } = useI18n();
const { meta: basketMeta } = useBasket();

const meta = computed(() => ({
  hasSummary:
    basketMeta.value.hasProducts ||
    (props.showWhileLoading && basketMeta.value.isLoading)
}));
</script>
