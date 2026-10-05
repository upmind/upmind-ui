<template>
  <Section
    v-if="meta.hasSummary"
    :label="t('cart.basket_section')"
    icon="shopping-bag-02"
  >
    <UpmBasketSummary :show-promotions="false" show-products />
  </Section>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { UpmBasketSummary } from "@upmind-automation/basket";
import { Section } from "@upmind-automation/foundation";
import { useBasket } from "@upmind-automation/headless";
import type { AuthSummarySlotProps } from "@upmind-automation/auth";

// -----------------------------------------------------------------------------

const props = defineProps<AuthSummarySlotProps>();

const { t } = useI18n();
const { meta: basketMeta } = useBasket();

const meta = computed(() => ({
  hasSummary:
    basketMeta.value.hasProducts ||
    (props.showWhileLoading && basketMeta.value.isLoading)
}));
</script>
