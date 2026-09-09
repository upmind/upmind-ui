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
// The basket-summary aside `auth` asks for through `foundation`'s shell socket.
// `basket` sits ABOVE `auth` in the ADR 023 §3 graph, so neither the summary nor
// the question "is there a basket to show" can be answered there; the shell owns
// the whole aside, its section chrome and its gate included.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Section } from "@upmind-automation/foundation";
import { useBasket } from "@upmind-automation/headless";
import Summary from "../../basket/components/Summary.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta: basketMeta } = useBasket();

const meta = computed(() => ({
  hasSummary: basketMeta.value.hasProducts || basketMeta.value.isLoading
}));
</script>
